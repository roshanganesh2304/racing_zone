/**
 * RACING ZONE - Real-Time Multiplayer Network Client
 * Manages WebSocket communication, snapshot interpolation buffer,
 * room lobbies, and telemetry synchronization.
 */

class MultiplayerClient {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.currentRoom = null;
    this.playerId = null;
    this.slot = 0;
    this.isHost = false;
    this.ping = 15;
    this.pingInterval = null;

    // Listeners: eventName -> Array of callback functions
    this.listeners = {
      roomList: [],
      roomJoined: [],
      roomUpdated: [],
      countdown: [],
      remoteUpdate: [],
      lapUpdate: [],
      playerFinished: [],
      raceResults: [],
      chat: [],
      error: [],
      connectionChange: []
    };
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      for (const cb of this.listeners[event]) {
        try { cb(data); } catch (e) { console.error(`Error in listener '${event}':`, e); }
      }
    }
  }

  connect(customPort = null) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    if (this._connectingPromise) {
      return this._connectingPromise;
    }

    this._connectingPromise = new Promise((resolve, reject) => {
      const hostname = window.location.hostname || '127.0.0.1';
      // Default WS port is 8081 (or port + 1)
      const port = customPort || (window.RACING_CONFIG && window.RACING_CONFIG.wsPort) || 8081;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${hostname}:${port}`;

      console.log(`🌐 Connecting to Multiplayer Server: ${wsUrl}`);
      try {
        this.ws = new WebSocket(wsUrl);
      } catch (err) {
        console.warn('WebSocket init failed:', err);
        this._connectingPromise = null;
        this.scheduleReconnect();
        return reject(err);
      }

      this.ws.onopen = () => {
        console.log('✅ Connected to Racing Zone Multiplayer Server!');
        this.isConnected = true;
        this._connectingPromise = null;
        this.clearReconnect();
        this.emit('connectionChange', { connected: true });
        this.startPingHeartbeat();
        this.requestRoomList();
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {
          console.error('Failed to parse WS message:', e, event.data);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Multiplayer WebSocket error:', err);
        this._connectingPromise = null;
        this.emit('error', { message: 'Could not connect to multiplayer server.' });
      };

      this.ws.onclose = () => {
        console.log('Multiplayer WebSocket closed.');
        this.isConnected = false;
        this._connectingPromise = null;
        this.stopPingHeartbeat();
        this.emit('connectionChange', { connected: false });
        this.scheduleReconnect();
      };
    });

    return this._connectingPromise;
  }

  scheduleReconnect() {
    if (this._reconnectTimer) return;
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      // Only reconnect if on multiplayer screen or active room
      const mpScreen = document.getElementById('screen-multiplayer');
      if (mpScreen && (mpScreen.classList.contains('active') || this.currentRoom)) {
        console.log('🔄 Attempting to reconnect to Multiplayer server...');
        this.connect().catch(() => {});
      }
    }, 2500);
  }

  clearReconnect() {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
  }

  startPingHeartbeat() {
    this.stopPingHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', client_time: performance.now() });
      }
    }, 3000);
  }

  stopPingHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  async send(obj) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      try {
        await this.connect();
      } catch (e) {
        console.warn("Cannot send message, WebSocket not open:", obj);
        return;
      }
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'pong': {
        if (msg.client_time) {
          this.ping = Math.round(performance.now() - msg.client_time);
        }
        break;
      }
      case 'room_list': {
        this.emit('roomList', msg.rooms || []);
        break;
      }
      case 'room_joined': {
        this.playerId = msg.player_id;
        this.slot = msg.slot;
        this.currentRoom = msg.room;
        this.isHost = (msg.room.host_id === this.playerId);
        this.emit('roomJoined', {
          roomCode: msg.room_code,
          slot: msg.slot,
          room: msg.room,
          playerId: this.playerId
        });
        break;
      }
      case 'room_updated': {
        this.currentRoom = msg.room;
        this.isHost = (msg.room.host_id === this.playerId);
        this.emit('roomUpdated', msg.room);
        break;
      }
      case 'race_start_countdown': {
        this.emit('countdown', msg);
        break;
      }
      case 'remote_player_update': {
        this.emit('remoteUpdate', msg);
        break;
      }
      case 'player_lap_updated': {
        this.emit('lapUpdate', msg);
        break;
      }
      case 'player_finished_notice': {
        this.emit('playerFinished', msg);
        break;
      }
      case 'race_results': {
        this.emit('raceResults', msg.standings);
        break;
      }
      case 'chat_message': {
        this.emit('chat', msg);
        break;
      }
      case 'player_left': {
        this.currentRoom = msg.room;
        this.isHost = (msg.room.host_id === this.playerId);
        this.emit('roomUpdated', msg.room);
        break;
      }
      case 'error': {
        this.emit('error', msg);
        break;
      }
      default:
        break;
    }
  }

  // --- Actions ---

  requestRoomList() {
    this.send({ type: 'list_rooms' });
  }

  createRoom({ username, carSlug, carColor, carName, trackSlug, laps }) {
    this.send({
      type: 'create_room',
      username,
      car_slug: carSlug,
      car_color: carColor,
      car_name: carName,
      track_slug: trackSlug || 'los-santos',
      laps: laps || 2,
      ping: this.ping
    });
  }

  joinRoom(roomCode, { username, carSlug, carColor, carName }) {
    this.send({
      type: 'join_room',
      room_code: roomCode,
      username,
      car_slug: carSlug,
      car_color: carColor,
      car_name: carName,
      ping: this.ping
    });
  }

  toggleReady(isReady, carConfig = null) {
    const payload = {
      type: 'toggle_ready',
      is_ready: isReady
    };
    if (carConfig) {
      payload.car_slug = carConfig.slug;
      payload.car_color = carConfig.color;
      payload.car_name = carConfig.name;
    }
    this.send(payload);
  }

  updateSettings({ trackSlug, laps }) {
    this.send({
      type: 'update_settings',
      track_slug: trackSlug,
      laps: laps
    });
  }

  startRace() {
    this.send({ type: 'start_race' });
  }

  sendTelemetry({ x, y, z, angle, speed, steerAngle, nitro, lap, checkpoint }) {
    this.send({
      type: 'telemetry',
      x, y, z,
      angle,
      speed,
      steerAngle,
      nitro: !!nitro,
      lap,
      checkpoint
    });
  }

  sendLapComplete(lap, lapTime) {
    this.send({
      type: 'lap_complete',
      lap,
      lap_time: lapTime
    });
  }

  sendFinish(raceTime, bestLap) {
    this.send({
      type: 'finish_race',
      race_time: raceTime,
      best_lap: bestLap
    });
  }

  sendChat(message) {
    this.send({
      type: 'chat',
      message: message
    });
  }

  leaveRoom() {
    this.send({ type: 'leave_room' });
    this.currentRoom = null;
    this.isHost = false;
    this.slot = 0;
  }
}

// Global Singleton
window.racingMultiplayer = new MultiplayerClient();
