#!/bin/sh
set -e

echo "📦 [Container] Initializing Production Environment..."

# Wait for database and run migrations
echo "📦 Running database migrations..."
# Disable exit on error for the retry loop
set +e
MAX_RETRIES=30
COUNT=0
while [ $COUNT -lt $MAX_RETRIES ]; do
    npx prisma migrate deploy
    if [ $? -eq 0 ]; then
        break
    fi
    COUNT=$((COUNT + 1))
    echo "⏳ Database not ready or migration failed, retrying in 2s ($COUNT/$MAX_RETRIES)..."
    sleep 2
done

if [ $COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Failed to apply migrations after $MAX_RETRIES attempts."
    exit 1
fi
set -e

echo "🚀 Starting server..."
# Check if we have the standalone server.js (Next.js output)
if [ -f server.js ]; then
    node server.js
else
    # Fallback for non-standalone builds
    npm run start
fi
