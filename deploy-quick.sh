#!/bin/bash

#######################################
# Quick Deployment Script
# Immediate deployment with current memory
#######################################

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting quick deployment...${NC}"

# Show current memory
echo "Current memory status:"
free -h

# Navigate to project
cd /root/likorea

# 1. Build frontend with optimized settings
echo -e "${YELLOW}Building frontend...${NC}"
cd frontend

# Clean previous build
rm -rf build

# Build with memory-optimized settings
export NODE_OPTIONS="--max-old-space-size=1536"
export NODE_ENV=production
export GENERATE_SOURCEMAP=false

npm run build

echo -e "${GREEN}Frontend build completed!${NC}"

# 2. Deploy backend
echo -e "${YELLOW}Deploying backend...${NC}"
cd ../backend

# Restart or start backend with PM2
if pm2 list | grep -q "likorea-backend"; then
    pm2 restart likorea-backend --update-env
else
    pm2 start server.js --name likorea-backend --update-env
fi

echo -e "${GREEN}Backend deployed!${NC}"

# 3. Show status
echo -e "${YELLOW}Deployment status:${NC}"
pm2 list

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo "Memory after deployment:"
free -h