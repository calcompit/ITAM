#!/usr/bin/env python3
"""
noVNC Launcher for Windows
A Python script to start noVNC proxy on Windows
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
    except ImportError:
        print("❌ websockify is not installed")
        print("Please run: pip install websockify")
        return False
    
    return True

def analyze_novnc_structure(novnc_dir):
    """Analyze the noVNC directory structure"""
    print("🔍 Analyzing noVNC directory structure...")
    print(f"   Base directory: {novnc_dir}")
    print()
    
    # Check common directories
    common_dirs = ["utils", "core", "app", "lib"]
    for dir_name in common_dirs:
        dir_path = novnc_dir / dir_name
        if dir_path.exists():
            print(f"✅ Found directory: {dir_name}/")
            # List some files in this directory
            try:
                files = list(dir_path.glob("*"))[:5]  # Show first 5 items
                for file in files:
                    if file.is_file():
                        print(f"   📄 {file.name}")
                    else:
                        print(f"   📁 {file.name}/")
            except Exception as e:
                print(f"   ❌ Error reading directory: {e}")
        else:
            print(f"❌ Missing directory: {dir_name}/")
    
    print()
    
    # Check for websockify specifically
    websockify_variants = [
        "utils/websockify/websockify.py",
        "utils/websockify.py",
        "websockify/websockify.py",
        "websockify.py"
    ]
    
    print("🔍 Looking for websockify...")
    for variant in websockify_variants:
        path = novnc_dir / variant
        if path.exists():
            print(f"✅ Found: {variant}")
        else:
            print(f"❌ Not found: {variant}")
    
    print()

def find_novnc_directory():
    """Find the noVNC directory"""
    current_dir = Path.cwd()
    novnc_dir = current_dir / "noVNC"
    
    if not novnc_dir.exists():
        print("❌ noVNC directory not found!")
        print("Please run setup-novnc-windows.bat first")
        return None
    
    return novnc_dir

def start_websockify(novnc_dir, vnc_host="localhost", vnc_port=5900, web_port=6081):
    """Start websockify proxy"""
    # Try multiple possible paths for websockify
    possible_paths = [
        novnc_dir / "utils" / "websockify" / "websockify.py",
        novnc_dir / "utils" / "websockify.py",
        novnc_dir / "websockify" / "websockify.py",
        novnc_dir / "websockify.py"
    ]
    
    websockify_path = None
    for path in possible_paths:
        if path.exists():
            websockify_path = path
            break
    
    if not websockify_path:
        print("❌ websockify.py not found!")
        print("Searched in:")
        for path in possible_paths:
            print(f"   - {path}")
        print()
        print("Please make sure noVNC is properly installed")
        print("Try running: setup-novnc-windows.bat")
        return None
    
    print(f"✅ Found websockify at: {websockify_path}")
    
    # Build the command
    cmd = [
        sys.executable,
        str(websockify_path),
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
    
    try:
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
    print("   noVNC Launcher for Windows")
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
    process = start_websockify(novnc_dir, vnc_host, vnc_port, web_port)
    if not process:
        print()
        print("🔧 Debugging information:")
        analyze_novnc_structure(novnc_dir)
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
