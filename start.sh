#!/bin/bash
# SSR Airport AI — Replit startup script
set -e

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${PORT:-3000}"

echo "============================================"
echo "  SSR Airport AI System"
echo "  Backend  → http://localhost:${BACKEND_PORT}"
echo "  Frontend → http://localhost:${FRONTEND_PORT}"
echo "============================================"

# ── Backend setup ────────────────────────────────
echo ""
echo "[1/4] Installing Python dependencies..."
cd "$(dirname "$0")/backend"

# Use a venv so installs are cached between runs
if [ ! -d ".venv" ]; then
    python3.11 -m venv .venv
fi
source .venv/bin/activate

pip install -r requirements.txt -q --disable-pip-version-check

# ── Frontend setup ───────────────────────────────
echo "[2/4] Installing Node dependencies..."
cd "$(dirname "$0")/frontend"
npm install --silent --prefer-offline 2>/dev/null || npm install --silent

# ── Start backend ────────────────────────────────
echo "[3/4] Starting FastAPI backend on port ${BACKEND_PORT}..."
cd "$(dirname "$0")/backend"
source .venv/bin/activate
export PYTHONPATH="$(pwd)"
uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "${BACKEND_PORT}" \
    --reload \
    --log-level info &
BACKEND_PID=$!

# Wait for backend to be ready
echo "  Waiting for backend..."
for i in $(seq 1 30); do
    if curl -sf "http://localhost:${BACKEND_PORT}/health" >/dev/null 2>&1; then
        echo "  Backend ready."
        break
    fi
    sleep 1
done

# ── Start frontend ───────────────────────────────
echo "[4/4] Starting Next.js frontend on port ${FRONTEND_PORT}..."
cd "$(dirname "$0")/frontend"
NEXT_PUBLIC_API_URL="http://localhost:${BACKEND_PORT}" \
    PORT="${FRONTEND_PORT}" \
    npm run dev

# If frontend exits, kill backend too
kill $BACKEND_PID 2>/dev/null || true
