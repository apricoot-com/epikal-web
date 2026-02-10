#!/bin/sh
set -e

# Detect if we are running on host or inside container
if [ -f /.dockerenv ]; then
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
    # Check if we have the standalone server.js
    if [ -f server.js ]; then
        node server.js
    else
        # Fallback for non-standalone builds
        npm run start
    fi
else
    echo "🚀 [Host] Starting Production Cluster..."
    
    # Check if we have node_modules and prisma client
    if [ ! -d "node_modules" ]; then
        echo "📦 node_modules not found. Installing dependencies..."
        npm install
    fi

    if [ ! -d "node_modules/.prisma" ]; then
        echo "📦 Prisma client not found. Generating..."
        npx prisma generate
    fi

    if command -v docker >/dev/null 2>&1; then
        # Use docker-compose.prod.yml
        if ! docker compose -f docker-compose.prod.yml ps | grep "epikal-postgres-prod" > /dev/null; then
            echo "🐳 Starting Docker containers..."
            docker compose -f docker-compose.prod.yml up -d
            echo "Waiting for database to be ready..."
            until docker compose -f docker-compose.prod.yml exec postgres pg_isready -U epikal -d epikal > /dev/null 2>&1; do
                echo "Waiting for postgres..."
                sleep 2
            done
            echo "✅ Database is ready!"
        else
            echo "✅ Docker containers are already running."
        fi
        echo "🚀 Production cluster is up. Use 'docker compose -f docker-compose.prod.yml logs -f' to see logs."
    else
        echo "❌ Docker not found. Please install Docker to run the production cluster."
        exit 1
    fi
fi
