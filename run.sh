#!/usr/bin/env bash
set -e

# Change directory to the project root where this script resides
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Allow custom port as the first argument, default to 8080 (freeing port 8000)
PORT="${1:-8080}"
HOST="0.0.0.0"

WS_PORT=$((PORT + 1))

# Detect local Wi-Fi / LAN IP for direct mobile device access
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1 || echo "127.0.0.1")

# Activate Python virtual environment if available
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "../venv/bin/activate" ]; then
    source ../venv/bin/activate
fi

# Check for active ngrok tunnel
NGROK_URL=$(python3 -c "import urllib.request, json; data=json.loads(urllib.request.urlopen('http://127.0.0.1:4040/api/tunnels', timeout=1).read()); print(data['tunnels'][0]['public_url'])" 2>/dev/null || true)

echo "=========================================================="
echo "🏎️  Racing Zone Web Application"
echo "🌐 Localhost:   http://127.0.0.1:${PORT}/"
echo "📱 Wi-Fi / LAN:  http://${LOCAL_IP}:${PORT}/ (Use this on Mobile!)"
echo "⚡ Multiplayer: ws://${LOCAL_IP}:${WS_PORT}/"
if [ -n "$NGROK_URL" ]; then
    echo "🌍 ngrok URL:   ${NGROK_URL}"
else
    echo "🌍 ngrok:       Not running (run 'ngrok http ${PORT}' to share)"
fi
echo "🔧 Python:      $(which python)"
echo "=========================================================="

# If ports are already in use, terminate them gracefully
EXISTING_PID=$(lsof -ti :${PORT} 2>/dev/null || true)
if [ -n "$EXISTING_PID" ]; then
    echo "⚠️  Port ${PORT} in use by PID(s): ${EXISTING_PID}. Releasing port..."
    kill -9 ${EXISTING_PID} 2>/dev/null || true
    sleep 0.5
fi

EXISTING_WS_PID=$(lsof -ti :${WS_PORT} 2>/dev/null || true)
if [ -n "$EXISTING_WS_PID" ]; then
    echo "⚠️  Multiplayer Port ${WS_PORT} in use by PID(s): ${EXISTING_WS_PID}. Releasing port..."
    kill -9 ${EXISTING_WS_PID} 2>/dev/null || true
    sleep 0.5
fi

# Start Multiplayer WebSocket Server in background
python manage.py run_multiplayer --host "${HOST}" --port "${WS_PORT}" &
MP_PID=$!

cleanup() {
    echo ""
    echo "🛑 Shutting down Racing Zone servers..."
    kill -9 $MP_PID 2>/dev/null || true
    exit 0
}
trap cleanup INT TERM EXIT

python manage.py runserver "${HOST}:${PORT}"

