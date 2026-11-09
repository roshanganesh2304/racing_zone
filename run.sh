#!/usr/bin/env bash

# Change directory to the project root where this script resides
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Parse CLI command and port arguments
# Examples:
#   ./run.sh                  -> starts on 8080
#   ./run.sh 8000             -> starts on 8000
#   ./run.sh stop             -> terminates running servers on 8080 & 8081
#   ./run.sh stop 8000        -> terminates servers on 8000 & 8001
#   ./run.sh status           -> checks server status
#   ./run.sh restart          -> restarts servers
ACTION="start"
PORT="8080"

if [ -n "$1" ]; then
    case "$1" in
        stop|terminate|kill|down)
            ACTION="stop"
            PORT="${2:-8080}"
            ;;
        status)
            ACTION="status"
            PORT="${2:-8080}"
            ;;
        restart)
            ACTION="restart"
            PORT="${2:-8080}"
            ;;
        start|up|run)
            ACTION="start"
            PORT="${2:-8080}"
            ;;
        [0-9]*)
            ACTION="start"
            PORT="$1"
            ;;
        *)
            ACTION="start"
            PORT="8080"
            ;;
    esac
fi

HOST="0.0.0.0"
WS_PORT=$((PORT + 1))

# Helper to stop running listeners on given ports
stop_servers() {
    local target_port="$1"
    local target_ws_port="$2"
    local found=0

    echo "🔍 Checking for running Racing Zone servers on ports ${target_port} & ${target_ws_port}..."

    local HTTP_PIDS=$(lsof -ti tcp:"${target_port}" -sTCP:LISTEN 2>/dev/null || true)
    if [ -n "$HTTP_PIDS" ]; then
        found=1
        echo "🛑 Terminating Web Server (port ${target_port}, PID: ${HTTP_PIDS})..."
        for pid in $HTTP_PIDS; do
            kill -15 "$pid" 2>/dev/null || true
            sleep 0.2
            kill -9 "$pid" 2>/dev/null || true
        done
    fi

    local WS_PIDS=$(lsof -ti tcp:"${target_ws_port}" -sTCP:LISTEN 2>/dev/null || true)
    if [ -n "$WS_PIDS" ]; then
        found=1
        echo "🛑 Terminating Multiplayer Server (port ${target_ws_port}, PID: ${WS_PIDS})..."
        for pid in $WS_PIDS; do
            kill -15 "$pid" 2>/dev/null || true
            sleep 0.2
            kill -9 "$pid" 2>/dev/null || true
        done
    fi

    # Also kill any orphaned multiplayer_server.py processes
    local ORPHAN_PIDS=$(pgrep -f "races/multiplayer_server.py" 2>/dev/null || true)
    if [ -n "$ORPHAN_PIDS" ]; then
        found=1
        for pid in $ORPHAN_PIDS; do
            kill -9 "$pid" 2>/dev/null || true
        done
    fi

    if [ "$found" -eq 1 ]; then
        echo "✅ Program terminated cleanly. Ports ${target_port} and ${target_ws_port} are released."
    else
        echo "ℹ️  No active Racing Zone servers found running on ports ${target_port} & ${target_ws_port}."
    fi
}

# 1. STOP / TERMINATE ACTION
if [ "$ACTION" = "stop" ]; then
    stop_servers "$PORT" "$WS_PORT"
    exit 0
fi

# 2. STATUS ACTION
if [ "$ACTION" = "status" ]; then
    HTTP_PIDS=$(lsof -ti tcp:"${PORT}" -sTCP:LISTEN 2>/dev/null || true)
    WS_PIDS=$(lsof -ti tcp:"${WS_PORT}" -sTCP:LISTEN 2>/dev/null || true)
    echo "=========================================================="
    echo "🏎️  Racing Zone Server Status"
    echo "----------------------------------------------------------"
    if [ -n "$HTTP_PIDS" ]; then
        echo "🌐 Web Server (FastAPI):       RUNNING (Port: ${PORT}, PID: ${HTTP_PIDS})"
    else
        echo "🌐 Web Server (FastAPI):       STOPPED (Port: ${PORT})"
    fi
    if [ -n "$WS_PIDS" ]; then
        echo "⚡ Multiplayer (WebSocket):     RUNNING (Port: ${WS_PORT}, PID: ${WS_PIDS})"
    else
        echo "⚡ Multiplayer (WebSocket):     STOPPED (Port: ${WS_PORT})"
    fi
    echo "=========================================================="
    exit 0
fi

# 3. RESTART ACTION
if [ "$ACTION" = "restart" ]; then
    stop_servers "$PORT" "$WS_PORT"
    sleep 1
fi

# 4. START ACTION
# Always ensure previous instances on target ports are cleared before starting
stop_servers "$PORT" "$WS_PORT" >/dev/null 2>&1

# Resolve Python binary (prioritize local virtual environment)
if [ -x "$DIR/venv/bin/python" ]; then
    PYTHON_BIN="$DIR/venv/bin/python"
    [ -f "$DIR/venv/bin/activate" ] && . "$DIR/venv/bin/activate"
elif [ -x "$DIR/../venv/bin/python" ]; then
    PYTHON_BIN="$DIR/../venv/bin/python"
    [ -f "$DIR/../venv/bin/activate" ] && . "$DIR/../venv/bin/activate"
elif command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="$(command -v python3)"
else
    PYTHON_BIN="$(command -v python)"
fi

# Detect local Wi-Fi / LAN IP for direct mobile device access
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1 || echo "127.0.0.1")

# Check for active ngrok tunnel if available
NGROK_URL=$("$PYTHON_BIN" -c "import urllib.request, json; data=json.loads(urllib.request.urlopen('http://127.0.0.1:4040/api/tunnels', timeout=0.5).read()); print(data['tunnels'][0]['public_url'])" 2>/dev/null || true)

echo "=========================================================="
echo "🏎️  Racing Zone Web Application (FastAPI Engine)"
echo "🌐 Localhost:   http://127.0.0.1:${PORT}/"
echo "📱 Wi-Fi / LAN:  http://${LOCAL_IP}:${PORT}/ (Open this on Mobile!)"
echo "⚡ Multiplayer: ws://${LOCAL_IP}:${WS_PORT}/"
if [ -n "$NGROK_URL" ]; then
    echo "🌍 ngrok URL:   ${NGROK_URL}"
else
    echo "🌍 ngrok:       Not running (run 'ngrok http ${PORT}' to share globally)"
fi
echo "🔧 Interpreter: ${PYTHON_BIN}"
echo "💡 Commands:    Ctrl+C to stop | ./run.sh stop to terminate"
echo "=========================================================="

# Start Multiplayer WebSocket Server in background
"$PYTHON_BIN" races/multiplayer_server.py "${HOST}" "${WS_PORT}" &
MP_PID=$!

cleanup() {
    trap - INT TERM EXIT
    echo ""
    echo "🛑 Shutting down Racing Zone servers..."
    if [ -n "$MP_PID" ] && kill -0 "$MP_PID" 2>/dev/null; then
        kill "$MP_PID" 2>/dev/null || true
    fi
    for p in $(lsof -ti tcp:"${PORT}" -sTCP:LISTEN 2>/dev/null || true); do
        kill -9 "$p" 2>/dev/null || true
    done
    for p in $(lsof -ti tcp:"${WS_PORT}" -sTCP:LISTEN 2>/dev/null || true); do
        kill -9 "$p" 2>/dev/null || true
    done
    echo "🏁 Program terminated successfully."
    exit 0
}
trap cleanup INT TERM

# Run FastAPI via Uvicorn in foreground
"$PYTHON_BIN" -m uvicorn main:app --host "${HOST}" --port "${PORT}" --reload

cleanup
