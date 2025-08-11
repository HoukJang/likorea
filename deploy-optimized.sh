#!/bin/bash

#######################################
# Memory-Optimized Deployment Script
# Handles low-memory situations during build
#######################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/root/likorea"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"
MIN_FREE_MEMORY_MB=1000  # Minimum free memory required for build
SWAP_SIZE="2G"  # Swap size to create if needed

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Function to check memory
check_memory() {
    local free_mem=$(free -m | awk 'NR==2{print $4}')
    local available_mem=$(free -m | awk 'NR==2{print $7}')
    
    print_status "Memory check: Free=${free_mem}MB, Available=${available_mem}MB"
    
    if [ "$available_mem" -lt "$MIN_FREE_MEMORY_MB" ]; then
        return 1
    fi
    return 0
}

# Function to free up memory
free_memory() {
    print_status "Freeing up system memory..."
    
    # Stop non-essential services
    print_status "Stopping development servers..."
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "npm start" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    pkill -f "craco start" 2>/dev/null || true
    
    # Clear package manager caches
    print_status "Clearing npm cache..."
    npm cache clean --force 2>/dev/null || true
    
    # Clear system caches (if we have permission)
    if [ -w /proc/sys/vm/drop_caches ]; then
        sync
        echo 1 > /proc/sys/vm/drop_caches 2>/dev/null || true
        print_success "System caches cleared"
    fi
    
    sleep 2
}

# Function to setup swap if needed
setup_swap() {
    local swap_total=$(free -m | awk 'NR==3{print $2}')
    
    if [ "$swap_total" -eq 0 ]; then
        print_warning "No swap detected. Creating swap file..."
        
        if [ -f /swapfile ]; then
            print_status "Swap file exists, activating..."
            sudo swapon /swapfile 2>/dev/null || true
        else
            print_status "Creating new swap file..."
            sudo fallocate -l $SWAP_SIZE /swapfile 2>/dev/null || \
                sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 2>/dev/null
            
            sudo chmod 600 /swapfile
            sudo mkswap /swapfile
            sudo swapon /swapfile
            
            # Make permanent
            if ! grep -q "/swapfile" /etc/fstab; then
                echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
            fi
            
            print_success "Swap space created and activated"
        fi
    else
        print_success "Swap space already configured: ${swap_total}MB"
    fi
}

# Function to build frontend with memory management
build_frontend() {
    print_status "Building frontend with memory optimization..."
    
    cd "$FRONTEND_DIR"
    
    # Check if build directory exists and clean it
    if [ -d "build" ]; then
        print_status "Cleaning previous build..."
        rm -rf build
    fi
    
    # Set memory limits for the build process
    export NODE_OPTIONS="--max-old-space-size=2048"
    
    # Try standard build first
    print_status "Attempting standard build..."
    if npm run build; then
        print_success "Frontend build completed successfully"
        return 0
    fi
    
    # If standard build fails, try with even more conservative memory settings
    print_warning "Standard build failed, trying with reduced memory usage..."
    
    # Free up more memory
    free_memory
    
    # Try with lower memory limit and garbage collection
    export NODE_OPTIONS="--max-old-space-size=1536 --expose-gc"
    
    # Use production mode to reduce memory usage
    export NODE_ENV=production
    export GENERATE_SOURCEMAP=false
    
    if npm run build; then
        print_success "Frontend build completed with reduced memory settings"
        return 0
    fi
    
    print_error "Frontend build failed"
    return 1
}

# Function to deploy backend
deploy_backend() {
    print_status "Deploying backend..."
    
    cd "$BACKEND_DIR"
    
    # Check if PM2 is running the backend
    if pm2 list | grep -q "likorea-backend"; then
        print_status "Restarting backend with PM2..."
        pm2 restart likorea-backend --update-env
    else
        print_status "Starting backend with PM2..."
        pm2 start server.js --name likorea-backend --update-env
    fi
    
    print_success "Backend deployed successfully"
}

# Function to check deployment status
check_deployment() {
    print_status "Checking deployment status..."
    
    # Check PM2 status
    pm2 list
    
    # Check if backend is responding
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/health | grep -q "200"; then
        print_success "Backend is responding"
    else
        print_warning "Backend health check failed"
    fi
    
    # Check nginx status
    if systemctl is-active --quiet nginx; then
        print_success "Nginx is running"
    else
        print_warning "Nginx is not running"
    fi
}

# Main deployment flow
main() {
    print_status "Starting memory-optimized deployment..."
    
    # Check initial memory
    if ! check_memory; then
        print_warning "Low memory detected, freeing up resources..."
        free_memory
        
        # Check again
        if ! check_memory; then
            print_warning "Still low on memory, setting up swap..."
            setup_swap
        fi
    fi
    
    # Show current memory status
    print_status "Current memory status:"
    free -h
    
    # Navigate to project directory
    cd "$PROJECT_DIR"
    
    # Pull latest changes (optional)
    if [ "$1" != "--skip-git" ]; then
        print_status "Pulling latest changes..."
        git pull origin main || print_warning "Git pull skipped or failed"
    fi
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm ci --prefer-offline --no-audit || npm install
    
    print_status "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm ci --prefer-offline --no-audit || npm install
    
    # Build frontend with memory management
    if ! build_frontend; then
        print_error "Frontend build failed, aborting deployment"
        exit 1
    fi
    
    # Deploy backend
    deploy_backend
    
    # Final memory cleanup
    free_memory
    
    # Check deployment
    check_deployment
    
    print_success "Deployment completed successfully!"
    print_status "Final memory status:"
    free -h
}

# Parse arguments
case "${1:-}" in
    --help)
        echo "Usage: $0 [OPTIONS]"
        echo "Options:"
        echo "  --skip-git    Skip git pull"
        echo "  --help        Show this help message"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac