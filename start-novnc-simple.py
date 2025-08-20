#!/usr/bin/env python3
"""
Simple noVNC Launcher
Uses websockify from pip package
"""

import os
import sys
import subprocess
import time
import argparse
import socket
from pathlib import Path

def check_prerequisites():
    """Check if required dependencies are installed"""
    try:
        import websockify
        print("✅ websockify is installed")
        return True
    except ImportError:
        print("❌ websockify is not installed")
        print("Please run: pip install websockify")
        return False

def find_novnc_directory():
    """Find the noVNC directory"""
    current_dir = Path.cwd()
    novnc_dir = current_dir / "noVNC"
    
    if not novnc_dir.exists():
        print("❌ noVNC directory not found!")
        print("Please run: git clone https://github.com/novnc/noVNC.git")
        return None
    
    return novnc_dir

def check_vnc_server(host, port):
    """Check if VNC server is accessible"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            print(f"✅ VNC server {host}:{port} is accessible")
            return True
        else:
            print(f"❌ VNC server {host}:{port} is not accessible")
            return False
    except Exception as e:
        print(f"❌ Error checking VNC server: {e}")
        return False

def start_websockify_simple(novnc_dir, vnc_host="10.51.101.83", vnc_port=5900, web_port=6081):
    """Start websockify using the pip package"""
    try:
        import websockify
        print("✅ Using websockify from pip package")
        
        # Check VNC server first
        if not check_vnc_server(vnc_host, vnc_port):
            print(f"⚠️  Warning: VNC server {vnc_host}:{vnc_port} may not be accessible")
            print("   Make sure the VNC server is running and accessible")
            print("   You can still try to connect, but it may fail")
            print()
        
        # Build the command using websockify module
        cmd = [
            sys.executable, "-m", "websockify",
            str(web_port),
            f"{vnc_host}:{vnc_port}",
            "--web", str(novnc_dir),
            "--verbose",
            "--log-file", "websockify.log"
        ]
        
        print(f"🚀 Starting websockify proxy...")
        print(f"   VNC Server: {vnc_host}:{vnc_port}")
        print(f"   Web Port: {web_port}")
        print(f"   Web Directory: {novnc_dir}")
        print()
        
        # Start the process
        process = subprocess.Popen(cmd, cwd=novnc_dir)
        return process
        
    except Exception as e:
        print(f"❌ Failed to start websockify: {e}")
        return None

def print_access_info(web_port, vnc_host, vnc_port):
    """Print access information"""
    print("=" * 50)
    print("   noVNC Access Information")
    print("=" * 50)
    print()
    print(f"🌐 Web Interface URLs:")
    print(f"   Main:     http://localhost:{web_port}/vnc.html")
    print(f"   Lite:     http://localhost:{web_port}/vnc_lite.html")
    print()
    print("🔧 Connection Settings:")
    print(f"   Host: localhost")
    print(f"   Port: {web_port}")
    print(f"   Password: 123")
    print()
    print("🔗 Direct VNC Connection:")
    print(f"   Target: {vnc_host}:{vnc_port}")
    print(f"   Password: 123")
    print()
    print("⏹️  Press Ctrl+C to stop the proxy")
    print("=" * 50)

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Simple noVNC Launcher')
    parser.add_argument('--vnc-host', default='10.51.101.83', 
                       help='VNC server host (default: 10.51.101.83)')
    parser.add_argument('--vnc-port', type=int, default=5900,
                       help='VNC server port (default: 5900)')
    parser.add_argument('--web-port', type=int, default=6081,
                       help='Web interface port (default: 6081)')
    return parser.parse_args()

def main():
    """Main function"""
    print("=" * 50)
    print("   Simple noVNC Launcher")
    print("=" * 50)
    print()
    
    # Parse command line arguments
    args = parse_arguments()
    
    # Check prerequisites
    if not check_prerequisites():
        input("Press Enter to exit...")
        return
    
    # Find noVNC directory
    novnc_dir = find_novnc_directory()
    if not novnc_dir:
        input("Press Enter to exit...")
        return
    
    print(f"✅ Found noVNC directory: {novnc_dir}")
    print()
    
    # Configuration from command line arguments
    vnc_host = args.vnc_host
    vnc_port = args.vnc_port
    web_port = args.web_port
    
    print(f"🔧 Configuration:")
    print(f"   VNC Server: {vnc_host}:{vnc_port}")
    print(f"   Web Port: {web_port}")
    print(f"   Password: 123")
    print()
    
    # Start websockify
    process = start_websockify_simple(novnc_dir, vnc_host, vnc_port, web_port)
    if not process:
        input("Press Enter to exit...")
        return
    
    # Wait a moment for the process to start
    time.sleep(2)
    
    # Check if process is still running
    if process.poll() is not None:
        print("❌ websockify failed to start")
        print("Check the logs for more information")
        input("Press Enter to exit...")
        return
    
    # Print access information
    print_access_info(web_port, vnc_host, vnc_port)
    
    try:
        # Keep the script running
        while process.poll() is None:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping websockify proxy...")
        process.terminate()
        process.wait()
        print("✅ Proxy stopped")
    
    input("Press Enter to exit...")

if __name__ == "__main__":
    main()
