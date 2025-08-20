#!/usr/bin/env python3
"""
Simple websockify test script
"""
import subprocess
import sys
import time
import socket
import os

def check_port(port):
    """Check if port is available"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('localhost', port))
            return True
    except OSError:
        return False

def test_websockify():
    """Test websockify installation and functionality"""
    print("=== Websockify Test ===")
    
    # Check Python
    print(f"Python version: {sys.version}")
    
    # Check websockify
    try:
        import websockify
        print("✅ websockify is installed")
    except ImportError:
        print("❌ websockify is not installed")
        print("Please run: pip install websockify")
        return False
    
    # Check noVNC directory
    novnc_dir = "noVNC"
    if os.path.exists(novnc_dir):
        print(f"✅ noVNC directory found: {novnc_dir}")
    else:
        print(f"❌ noVNC directory not found: {novnc_dir}")
        print("Please run: git clone https://github.com/novnc/noVNC.git")
        return False
    
    # Check port 6081
    if check_port(6081):
        print("✅ Port 6081 is available")
    else:
        print("❌ Port 6081 is in use")
        return False
    
    # Test websockify command
    print("\nTesting websockify command...")
    try:
        cmd = [
            sys.executable, "-m", "websockify",
            "6081",
            "10.51.101.83:5900",
            "--web", os.path.join(novnc_dir, "core"),
            "--verbose"
        ]
        
        print(f"Running: {' '.join(cmd)}")
        
        # Start websockify in background
        process = subprocess.Popen(
            cmd,
            cwd=novnc_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        print(f"Websockify started with PID: {process.pid}")
        
        # Wait a moment
        time.sleep(2)
        
        # Check if process is still running
        if process.poll() is None:
            print("✅ Websockify is running")
            
            # Kill the process
            process.terminate()
            process.wait()
            print("✅ Websockify test completed successfully")
            return True
        else:
            stdout, stderr = process.communicate()
            print(f"❌ Websockify failed to start")
            print(f"STDOUT: {stdout.decode()}")
            print(f"STDERR: {stderr.decode()}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing websockify: {e}")
        return False

if __name__ == "__main__":
    success = test_websockify()
    if success:
        print("\n🎉 All tests passed!")
    else:
        print("\n❌ Tests failed!")
        sys.exit(1)
