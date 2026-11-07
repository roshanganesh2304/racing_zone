import os
import sys
import socket
import threading
import asyncio
from django.apps import AppConfig


def _is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def _run_server_thread():
    if _is_port_in_use(8081):
        return
    try:
        from races.multiplayer_server import MultiplayerServer
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        srv = MultiplayerServer(host='0.0.0.0', port=8081)
        loop.run_until_complete(srv.start())
    except Exception as e:
        pass


class RacesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'races'

    def ready(self):
        # Avoid running in management commands like migrate, makemigrations, collectstatic
        if any(cmd in sys.argv for cmd in ['migrate', 'makemigrations', 'shell', 'test', 'run_multiplayer']):
            return

        threading.Thread(target=_run_server_thread, daemon=True).start()

