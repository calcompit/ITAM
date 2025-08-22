#!/bin/bash

# Push script for Windows PC deployment
# This script pushes code to git repository so Windows PC can pull it

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

# Function to push code to git repository
push_to_git() {
    print_status "Pushing code to git repository..."
    
    # Check git status
    print_status "Checking git status..."
    git status --porcelain
    
    # Add all changes
    print_status "Adding all changes..."
    git add .
    
    # Commit changes
    print_status "Committing changes..."
    git commit -m "Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S') - Database connection fixes and VNC improvements"
    
    # Push to remote repository
    print_status "Pushing to remote repository..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        print_success "Code pushed to git repository successfully"
        return 0
    else
        print_error "Failed to push to git repository"
        return 1
    fi
}

# Function to show deployment instructions
show_instructions() {
    print_status "Deployment Instructions for Windows PC:"
    echo ""
    echo "1. Open Command Prompt on Windows PC (dell-pc@10.51.101.49)"
    echo "2. Navigate to project directory:"
    echo "   cd C:\\Users\\Dell-PC\\OneDrive\\Documents\\itam"
    echo ""
    echo "3. Pull latest changes:"
    echo "   git pull origin main"
    echo ""
    echo "4. Install dependencies (if needed):"
    echo "   npm install"
    echo ""
    echo "5. Start the server:"
    echo "   npm run dev"
    echo ""
    echo "6. Or run the batch script:"
    echo "   deploy-windows.bat"
    echo ""
    print_success "Code is ready for deployment on Windows PC!"
}

# Main script logic
case "$1" in
    "push")
        push_to_git
        if [ $? -eq 0 ]; then
            show_instructions
        fi
        ;;
    "status")
        print_status "Git status:"
        git status
        ;;
    "help")
        echo "Usage: $0 {push|status|help}"
        echo ""
        echo "Commands:"
        echo "  push   - Push code to git repository for Windows PC deployment"
        echo "  status - Show git status"
        echo "  help   - Show this help message"
        ;;
    *)
        push_to_git
        if [ $? -eq 0 ]; then
            show_instructions
        fi
        ;;
esac
