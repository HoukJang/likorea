#!/bin/bash

# Increase Node.js memory limit for frontend build
export NODE_OPTIONS="--max-old-space-size=4096"

# Kill any existing process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start the frontend
echo "Starting frontend with increased memory limit..."
npm start