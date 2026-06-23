#!/bin/bash

set -e
cd "$(dirname "$0")"

IP=$(hostname -I | awk '{print $1}')

cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Remove server processes previously started from this project directory
for pid in $(pgrep -f "python3 server.py" || true); do
  if [[ "$(readlink /proc/$pid/cwd)" == "$PWD" ]]; then
    kill "$pid" 2>/dev/null || true
  fi
done
for pid in $(pgrep -f "python3 http_server.py" || true); do
  if [[ "$(readlink /proc/$pid/cwd)" == "$PWD" ]]; then
    kill "$pid" 2>/dev/null || true
  fi
done

echo ""
echo "===================================="
echo "Servidor iniciado"
echo "IP: $IP"
echo "WebSocket: ws://$IP:8001"
echo "HTTP: http://$IP:8000"
echo "===================================="
echo ""

python3 server.py &
SERVER_PID=$!

python3 http_server.py