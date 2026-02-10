#!/bin/sh
set -e

# Run migrations
echo "Running migrations..."
npx prisma migrate deploy

echo "Starting server..."
node server.js
