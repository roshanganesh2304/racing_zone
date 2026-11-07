"""
RACING ZONE - Real-Time Multiplayer WebSocket Match Server
Handles match lobbies, real-time vehicle telemetry broadcasts,
room state synchronization, and race result arbitration.
"""

import asyncio
import json
import logging
import random
import string
import time
import websockets

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("MultiplayerServer")

def generate_room_code():
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=4))
    return f"RZ-{suffix}"

class RaceRoom:
    def __init__(self, code, host_player_id, track_slug="neon_city", laps=2, is_public=True):
        self.code = code
        self.host_id = host_player_id
        self.track_slug = track_slug
        self.laps = laps
        self.is_public = is_public
        self.status = "waiting"  # 'waiting', 'countdown', 'racing', 'finished'
        self.players = {}  # player_id -> dict(ws, username, car_slug, car_color, is_ready, slot, finish_time, lap, rank)
        self.race_start_time = None
        self.finished_count = 0
        self.created_at = time.time()

    def to_summary(self):
        return {
            "code": self.code,
            "track_slug": self.track_slug,
            "laps": self.laps,
            "player_count": len(self.players),
            "max_players": 4,
            "status": self.status,
            "host_name": self.players.get(self.host_id, {}).get("username", "Host") if self.host_id in self.players else "Host"
        }

    def to_detail(self):
        return {
            "code": self.code,
            "host_id": self.host_id,
            "track_slug": self.track_slug,
            "laps": self.laps,
            "status": self.status,
            "players": [
                {
                    "id": pid,
                    "username": p["username"],
                    "car_slug": p["car_slug"],
                    "car_color": p["car_color"],
                    "car_name": p.get("car_name", "Supercar"),
                    "is_ready": p["is_ready"],
                    "is_host": (pid == self.host_id),
                    "slot": p["slot"],
                    "ping": p.get("ping", 15)
                }
                for pid, p in self.players.items()
            ]
        }

    async def broadcast(self, message_dict, exclude_player_id=None):
        payload = json.dumps(message_dict)
        coros = []
        for pid, p in list(self.players.items()):
            if exclude_player_id and pid == exclude_player_id:
                continue
            ws = p.get("ws")
            if ws:
                coros.append(self._safe_send(ws, payload))
        if coros:
            await asyncio.gather(*coros, return_exceptions=True)

    async def _safe_send(self, ws, payload):
        try:
            await ws.send(payload)
        except Exception:
            pass


class MultiplayerServer:
    def __init__(self, host="0.0.0.0", port=8081):
        self.host = host
        self.port = port
        self.rooms = {}  # room_code -> RaceRoom
        self.player_room_map = {}  # ws -> (room_code, player_id)

    async def handle_connection(self, websocket):
        player_id = f"p_{int(time.time()*1000)}_{random.randint(100, 999)}"
        logger.info(f"Client connected: {player_id}")

        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                except Exception as e:
                    logger.warning(f"Invalid JSON received from {player_id}: {e}")
                    continue

                msg_type = data.get("type")
                if msg_type == "ping":
                    await websocket.send(json.dumps({"type": "pong", "client_time": data.get("client_time")}))
                elif msg_type == "list_rooms":
                    await self._send_room_list(websocket)
                elif msg_type == "create_room":
                    await self._handle_create_room(websocket, player_id, data)
                elif msg_type == "join_room":
                    await self._handle_join_room(websocket, player_id, data)
                elif msg_type == "toggle_ready":
                    await self._handle_toggle_ready(player_id, data)
                elif msg_type == "update_settings":
                    await self._handle_update_settings(player_id, data)
                elif msg_type == "start_race":
                    await self._handle_start_race(player_id)
                elif msg_type == "telemetry":
                    await self._handle_telemetry(player_id, data)
                elif msg_type == "lap_complete":
                    await self._handle_lap_complete(player_id, data)
                elif msg_type == "finish_race":
                    await self._handle_finish_race(player_id, data)
                elif msg_type == "chat":
                    await self._handle_chat(player_id, data)
                elif msg_type == "leave_room":
                    await self._handle_leave(websocket)
        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as e:
            logger.error(f"Error handling connection {player_id}: {e}")
        finally:
            await self._handle_leave(websocket)
            logger.info(f"Client disconnected: {player_id}")

    async def _send_room_list(self, websocket):
        available_rooms = [
            room.to_summary() for room in self.rooms.values()
            if room.status == "waiting" and len(room.players) < 4
        ]
        await websocket.send(json.dumps({
            "type": "room_list",
            "rooms": available_rooms
        }))

    async def _handle_create_room(self, ws, player_id, data):
        # Generate unique room code
        code = generate_room_code()
        while code in self.rooms:
            code = generate_room_code()

        track_slug = data.get("track_slug", "neon_city")
        laps = int(data.get("laps", 2))
        room = RaceRoom(code, player_id, track_slug=track_slug, laps=laps)

        room.players[player_id] = {
            "ws": ws,
            "username": data.get("username", "Racer 1"),
            "car_slug": data.get("car_slug", "porsche-911-gt3-rs"),
            "car_color": data.get("car_color", "#00f0ff"),
            "car_name": data.get("car_name", "Porsche 911 GT3 RS"),
            "is_ready": True,  # Host defaults to ready
            "slot": 0,
            "ping": data.get("ping", 15),
            "lap": 1,
            "finish_time": None
        }

        self.rooms[code] = room
        self.player_room_map[ws] = (code, player_id)

        logger.info(f"Room {code} created by {player_id}")
        await ws.send(json.dumps({
            "type": "room_joined",
            "room_code": code,
            "player_id": player_id,
            "slot": 0,
            "room": room.to_detail()
        }))

    async def _handle_join_room(self, ws, player_id, data):
        code = data.get("room_code", "").strip().upper()
        room = self.rooms.get(code)

        if not room:
            await ws.send(json.dumps({"type": "error", "message": f"Room '{code}' not found."}))
            return

        if len(room.players) >= 4:
            await ws.send(json.dumps({"type": "error", "message": "Room is already full (max 4 racers)."}))
            return

        if room.status != "waiting":
            await ws.send(json.dumps({"type": "error", "message": "Race already in progress in this room."}))
            return

        # Find first available slot 0..3
        used_slots = {p["slot"] for p in room.players.values()}
        slot = 0
        for s in range(4):
            if s not in used_slots:
                slot = s
                break

        room.players[player_id] = {
            "ws": ws,
            "username": data.get("username", f"Racer {slot+1}"),
            "car_slug": data.get("car_slug", "ferrari-488-gtb"),
            "car_color": data.get("car_color", "#ff2a5f"),
            "car_name": data.get("car_name", "Ferrari 488 GTB"),
            "is_ready": False,
            "slot": slot,
            "ping": data.get("ping", 20),
            "lap": 1,
            "finish_time": None
        }

        self.player_room_map[ws] = (code, player_id)
        logger.info(f"Player {player_id} joined room {code} in slot {slot}")

        # Send confirmation to joined player
        await ws.send(json.dumps({
            "type": "room_joined",
            "room_code": code,
            "player_id": player_id,
            "slot": slot,
            "room": room.to_detail()
        }))

        # Broadcast update to everyone in room
        await room.broadcast({
            "type": "room_updated",
            "room": room.to_detail()
        })

    async def _handle_toggle_ready(self, player_id, data):
        info = self._get_player_room_by_id(player_id)
        if not info:
            return
        room, player = info

        if room.status != "waiting":
            return

        is_ready = bool(data.get("is_ready", not player["is_ready"]))
        player["is_ready"] = is_ready
        if "car_slug" in data:
            player["car_slug"] = data["car_slug"]
        if "car_color" in data:
            player["car_color"] = data["car_color"]
        if "car_name" in data:
            player["car_name"] = data["car_name"]

        await room.broadcast({
            "type": "room_updated",
            "room": room.to_detail()
        })

    async def _handle_update_settings(self, player_id, data):
        info = self._get_player_room_by_id(player_id)
        if not info:
            return
        room, player = info

        if room.host_id != player_id or room.status != "waiting":
            return

        if "track_slug" in data:
            room.track_slug = data["track_slug"]
        if "laps" in data:
            room.laps = max(1, min(10, int(data["laps"])))

        await room.broadcast({
            "type": "room_updated",
            "room": room.to_detail()
        })

    async def _handle_start_race(self, player_id):
        info = self._get_player_room_by_id(player_id)
        if not info:
            return
        room, player = info

        if room.host_id != player_id:
            return

        # Check if all players are ready
        if any(not p["is_ready"] for p in room.players.values()):
            ws = player.get("ws")
            if ws:
                await ws.send(json.dumps({
                    "type": "error",
                    "message": "Cannot start race: Not all racers are ready!"
                }))
            return

        room.status = "countdown"
        room.finished_count = 0
        start_in_seconds = 4.0
        countdown_timestamp = time.time() + start_in_seconds
        room.race_start_time = countdown_timestamp

        logger.info(f"Room {room.code} starting countdown!")

        # Broadcast race start payload with all players' start slots and car configurations
        await room.broadcast({
            "type": "race_start_countdown",
            "start_timestamp": countdown_timestamp,
            "track_slug": room.track_slug,
            "laps": room.laps,
            "players": [
                {
                    "id": pid,
                    "username": p["username"],
                    "car_slug": p["car_slug"],
                    "car_color": p["car_color"],
                    "car_name": p.get("car_name", "Supercar"),
                    "slot": p["slot"]
                }
                for pid, p in room.players.items()
            ]
        })

    async def _handle_telemetry(self, player_id, data):
        info = self._get_player_room_by_id(player_id)
        if not info:
            return
        room, player = info

        # Relay telemetry only to OTHER players in the room
        await room.broadcast({
            "type": "remote_player_update",
            "player_id": player_id,
            "slot": player["slot"],
            "x": data.get("x", 0),
            "y": data.get("y", 0),
            "z": data.get("z", 0),
            "angle": data.get("angle", 0),
            "speed": data.get("speed", 0),
            "steerAngle": data.get("steerAngle", 0),
            "nitro": data.get("nitro", False),
            "lap": data.get("lap", 1),
            "checkpoint": data.get("checkpoint", 0),
            "time": time.time()
        }, exclude_player_id=player_id)

    async def _handle_lap_complete(self, player_id, data):
        info = self._get_player_room_by_id(player_id)
        if not info:
            return
        room, player = info
        player["lap"] = data.get("lap", player["lap"] + 1)

        await room.broadcast({
            "type": "player_lap_updated",
            "player_id": player_id,
            "username": player["username"],
            "lap": player["lap"],
            "lap_time": data.get("lap_time")
        })

    async def _handle_finish_race(self, player_id, data):
        info = self._get_player_room_by_id(player_id)
        if not info:
            return
        room, player = info

        if player.get("finish_time") is not None:
            return  # Already recorded

        room.finished_count += 1
        rank = room.finished_count
        finish_time = float(data.get("race_time", 0.0))
        best_lap = float(data.get("best_lap", 0.0))

        player["finish_time"] = finish_time
        player["best_lap"] = best_lap
        player["rank"] = rank

        logger.info(f"Room {room.code}: {player['username']} finished P{rank} in {finish_time:.2f}s")

        # Broadcast finish update
        await room.broadcast({
            "type": "player_finished_notice",
            "player_id": player_id,
            "username": player["username"],
            "rank": rank,
            "race_time": finish_time,
            "best_lap": best_lap
        })

        # If all players have finished
        if room.finished_count >= len(room.players):
            room.status = "finished"
            standings = sorted(
                [
                    {
                        "id": pid,
                        "username": p["username"],
                        "car_name": p.get("car_name", "Supercar"),
                        "rank": p.get("rank", 99),
                        "race_time": p.get("finish_time", 999.0),
                        "best_lap": p.get("best_lap", 0.0)
                    }
                    for pid, p in room.players.items()
                ],
                key=lambda x: x["rank"]
            )
            await room.broadcast({
                "type": "race_results",
                "standings": standings
            })

    async def _handle_chat(self, player_id, data):
        info = self._get_player_room_by_id(player_id)
        if not info:
            return
        room, player = info
        text = str(data.get("message", "")).strip()[:100]
        if not text:
            return

        await room.broadcast({
            "type": "chat_message",
            "player_id": player_id,
            "username": player["username"],
            "message": text
        })

    async def _handle_leave(self, ws):
        if ws not in self.player_room_map:
            return
        code, player_id = self.player_room_map.pop(ws)
        room = self.rooms.get(code)
        if not room:
            return

        player = room.players.pop(player_id, None)
        username = player.get("username", "A racer") if player else "A racer"
        logger.info(f"Player {player_id} left room {code}")

        # If room is now empty, delete it
        if not room.players:
            del self.rooms[code]
            logger.info(f"Room {code} deleted (empty)")
            return

        # If host left, reassign host to next player
        if room.host_id == player_id:
            room.host_id = next(iter(room.players.keys()))
            logger.info(f"Room {code}: new host is {room.host_id}")

        await room.broadcast({
            "type": "player_left",
            "player_id": player_id,
            "username": username,
            "room": room.to_detail()
        })

    def _get_player_room_by_id(self, player_id):
        for room in self.rooms.values():
            if player_id in room.players:
                return room, room.players[player_id]
        return None

    async def start(self):
        logger.info(f"🏁 Racing Zone Multiplayer Server starting on ws://{self.host}:{self.port}")
        async with websockets.serve(self.handle_connection, self.host, self.port):
            await asyncio.Future()  # run forever

def run_server(host="0.0.0.0", port=8081):
    server = MultiplayerServer(host=host, port=port)
    asyncio.run(server.start())

if __name__ == "__main__":
    import sys
    h = sys.argv[1] if len(sys.argv) > 1 else "0.0.0.0"
    p = int(sys.argv[2]) if len(sys.argv) > 2 else 8081
    run_server(host=h, port=p)
