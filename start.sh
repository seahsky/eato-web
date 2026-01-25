#!/bin/sh
# =============================================================================
# Startup script for Flutter + Next.js container
# Starts Next.js API server, then Nginx in foreground
# =============================================================================

set -e

# Trap signals for graceful shutdown
cleanup() {
    echo "Received shutdown signal, stopping services..."
    if [ -n "$NEXTJS_PID" ]; then
        kill -TERM "$NEXTJS_PID" 2>/dev/null || true
    fi
    nginx -s quit 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

echo "========================================"
echo "Starting Eato services..."
echo "========================================"

# Generate Prisma client (in case it wasn't generated during build)
echo "[1/4] Generating Prisma client..."
cd /app && npx prisma generate

# Validate required environment variables
echo "[2/4] Validating environment..."
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Start Next.js API server in background
echo "[3/4] Starting Next.js API server on port 3000..."
cd /app && node_modules/.bin/next start -p 3000 &
NEXTJS_PID=$!

# Wait for Next.js to be ready with timeout
echo "Waiting for Next.js to initialize..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -sf http://127.0.0.1:3000/api/rest/health > /dev/null 2>&1; then
        echo "Next.js API is ready!"
        break
    fi

    # Check if Next.js process is still running
    if ! kill -0 "$NEXTJS_PID" 2>/dev/null; then
        echo "ERROR: Next.js process exited unexpectedly"
        exit 1
    fi

    ATTEMPT=$((ATTEMPT + 1))
    echo "  Attempt $ATTEMPT/$MAX_ATTEMPTS - waiting..."
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "ERROR: Next.js failed to start within timeout"
    exit 1
fi

# Start Nginx in foreground (keeps container running)
echo "[4/4] Starting Nginx on port 8080..."
echo "========================================"
echo "Eato is ready!"
echo "  - Flutter Web: http://localhost:8080/"
echo "  - API:         http://localhost:8080/api/"
echo "  - Health:      http://localhost:8080/api/rest/health"
echo "========================================"

nginx -g 'daemon off;'
