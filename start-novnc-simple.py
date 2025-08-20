#!/usr/bin/env python3
"""
Simple noVNC Launcher for Windows
Uses websockify from pip package
"""

import os
import sys
import subprocess
import time
import signal
import threading
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
        print("Please run setup-novnc-windows.bat first")
        return None
    
    return novnc_dir

def start_websockify_simple(novnc_dir, vnc_host="localhost", vnc_port=5900, web_port=6081):
    """Start websockify using the pip package"""
    try:
        import websockify
        print("✅ Using websockify from pip package")
        
        # Build the command using websockify module
        cmd = [
            sys.executable, "-m", "websockify",
            str(web_port),
            f"{vnc_host}:{vnc_port}",
            "--web", str(novnc_dir),
            "--verbose"
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

def print_access_info(web_port):
    """Print access information"""
    print("=" * 50)
    print("   noVNC Access Information")
    print("=" * 50)
    print()
    print(f"🌐 Web Interface URLs:")
    print(f"   Main:     http://localhost:{web_port}/vnc.html")
    print(f"   Lite:     http://localhost:{web_port}/vnc_lite.html")
    print(f"   App:      http://localhost:{web_port}/app/")
    print()
    print("📱 Mobile Access:")
    print(f"   iOS/Android: http://your-ip:{web_port}/vnc.html")
    print()
    print("🔧 Connection Settings:")
    print(f"   Host: localhost")
    print(f"   Port: {web_port}")
    print(f"   Password: (enter your VNC password)")
    print()
    print("⏹️  Press Ctrl+C to stop the proxy")
    print("=" * 50)

def main():
    """Main function"""
    print("=" * 50)
    print("   Simple noVNC Launcher for Windows")
    print("=" * 50)
    print()
    
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
    
    # Configuration
    vnc_host = "localhost"
    vnc_port = 5900
    web_port = 6081
    
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
        input("Press Enter to exit...")
        return
    
    # Print access information
    print_access_info(web_port)
    
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
