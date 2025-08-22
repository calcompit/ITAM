#!/bin/bash

# Deploy script for Windows PC
# Usage: ./deploy-windows-pc.sh [push|pull|deploy|status]

WINDOWS_HOST="dell-pc@100.117.205.41"
WINDOWS_PASSWORD="010138259"
WINDOWS_PATH="C:/Users/Dell-PC/OneDrive/Documents/itam"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to push code to Windows PC
push_to_windows() {
    print_status "Pushing code to Windows PC..."
    
    # First, push to git repository
    print_status "Pushing to git repository..."
    git add .
    git commit -m "Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S') - Latest updates"
    git push origin main
    
    if [ $? -eq 0 ]; then
        print_success "Code pushed to git repository successfully"
    else
        print_error "Failed to push to git repository"
        return 1
    fi
    
    # Then, pull on Windows PC
    print_status "Pulling code on Windows PC..."
    sshpass -p "$WINDOWS_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -T "$WINDOWS_HOST" << 'EOF'
        cd "C:/Users/Dell-PC/OneDrive/Documents/itam"
        git pull origin main
        npm install
        echo "Deployment completed on Windows PC"
EOF
    
    if [ $? -eq 0 ]; then
        print_success "Code deployed to Windows PC successfully"
    else
        print_error "Failed to deploy to Windows PC"
        return 1
    fi
}

# Function to pull from Windows PC
pull_from_windows() {
    print_status "Pulling code from Windows PC..."
    
    # Pull from git repository first
    print_status "Pulling from git repository..."
    git pull origin main
    
    if [ $? -eq 0 ]; then
        print_success "Code pulled from git repository successfully"
    else
        print_error "Failed to pull from git repository"
        return 1
    fi
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        return 1
    fi
}

# Function to deploy to Windows PC
deploy_to_windows() {
    print_status "Deploying to Windows PC..."
    
    # Copy deploy script to Windows PC
    print_status "Copying deploy script to Windows PC..."
    sshpass -p "$WINDOWS_PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null deploy-windows.bat "$WINDOWS_HOST:$WINDOWS_PATH/"
    
    if [ $? -eq 0 ]; then
        print_success "Deploy script copied successfully"
    else
        print_error "Failed to copy deploy script"
        return 1
    fi
    
    # Execute deploy script on Windows PC
    print_status "Executing deploy script on Windows PC..."
    sshpass -p "$WINDOWS_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -T "$WINDOWS_HOST" << 'EOF'
        cd "C:/Users/Dell-PC/OneDrive/Documents/itam"
        deploy-windows.bat
EOF
    
    if [ $? -eq 0 ]; then
        print_success "Deployment completed successfully"
    else
        print_error "Deployment failed"
        return 1
    fi
}

# Function to check Windows PC status
check_windows_status() {
    print_status "Checking Windows PC status..."
    
    sshpass -p "$WINDOWS_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -T "$WINDOWS_HOST" << 'EOF'
        echo "=== System Information ==="
        systeminfo | findstr /C:"OS Name" /C:"OS Version" /C:"System Type"
        echo ""
        echo "=== Node.js Processes ==="
        tasklist /FI "IMAGENAME eq node.exe"
        echo ""
        echo "=== Project Directory ==="
        if exist "C:\Users\Dell-PC\OneDrive\Documents\itam" (
            echo "Project directory exists"
            cd "C:\Users\Dell-PC\OneDrive\Documents\itam"
            echo "Current directory: %CD%"
            git status --porcelain
        ) else (
            echo "Project directory does not exist"
        )
EOF
}

# Function to connect to Windows PC
connect_to_windows() {
    print_status "Connecting to Windows PC..."
    print_status "Host: $WINDOWS_HOST"
    print_status "Path: $WINDOWS_PATH"
    
    sshpass -p "$WINDOWS_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$WINDOWS_HOST"
}

# Function to start server on Windows PC
start_server() {
    print_status "Starting server on Windows PC..."
    
    sshpass -p "$WINDOWS_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -T "$WINDOWS_HOST" << 'EOF'
        cd "C:/Users/Dell-PC/OneDrive/Documents/itam"
        echo "Starting IT Asset Monitor server..."
        start "IT Asset Monitor Server" cmd /c "npm run dev"
        echo "Server started successfully"
EOF
    
    if [ $? -eq 0 ]; then
        print_success "Server started successfully on Windows PC"
        print_status "Server should be running on http://100.117.205.41:3002"
        print_status "Frontend should be running on http://100.117.205.41:8081"
    else
        print_error "Failed to start server on Windows PC"
        return 1
    fi
}

# Main script logic
case "$1" in
    "push")
        push_to_windows
        ;;
    "pull")
        pull_from_windows
        ;;
    "deploy")
        deploy_to_windows
        ;;
    "status")
        check_windows_status
        ;;
    "connect")
        connect_to_windows
        ;;
    "start")
        start_server
        ;;
    *)
        echo "Usage: $0 {push|pull|deploy|status|connect|start}"
        echo ""
        echo "Commands:"
        echo "  push    - Push code to Windows PC"
        echo "  pull    - Pull code from git repository"
        echo "  deploy  - Deploy code to Windows PC"
        echo "  status  - Check Windows PC status"
        echo "  connect - Connect to Windows PC via SSH"
        echo "  start   - Start server on Windows PC"
        exit 1
        ;;
esac
