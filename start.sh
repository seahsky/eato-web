#!/bin/sh
# =============================================================================
# Startup script for Flutter + Next.js container
# Starts Next.js API server, then Nginx in foreground
# =============================================================================

set -e

echo "Starting Eato services..."

# Generate Prisma client (in case it wasn't generated during build)
echo "Generating Prisma client..."
cd /app && npx prisma generate

# Start Next.js API server in background
echo "Starting Next.js API server on port 3000..."
cd /app && node_modules/.bin/next start -p 3000 &

# Wait for Next.js to be ready
echo "Waiting for Next.js to initialize..."
sleep 5

# Verify Next.js is running
if curl -s http://127.0.0.1:3000/api/rest/health > /dev/null 2>&1; then
    echo "Next.js API is ready!"
else
    echo "Warning: Could not verify Next.js health endpoint, continuing anyway..."
fi

# Start Nginx in foreground (keeps container running)
echo "Starting Nginx on port 8080..."
nginx -g 'daemon off;'
