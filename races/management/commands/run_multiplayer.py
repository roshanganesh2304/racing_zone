from django.core.management.base import BaseCommand
from races.multiplayer_server import run_server

class Command(BaseCommand):
    help = "Starts the Racing Zone real-time multiplayer WebSocket server"

    def add_arguments(self, parser):
        parser.add_argument("--host", type=str, default="0.0.0.0", help="Host IP to bind (default: 0.0.0.0)")
        parser.add_argument("--port", type=int, default=8081, help="Port to bind (default: 8081)")

    def handle(self, *args, **options):
        host = options["host"]
        port = options["port"]
        self.stdout.write(self.style.SUCCESS(f"🏁 Starting Racing Zone Multiplayer Server on ws://{host}:{port}"))
        try:
            run_server(host=host, port=port)
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("Multiplayer server stopped."))
