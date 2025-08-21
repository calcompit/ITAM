#!/usr/bin/env python3
"""
Dynamic websockify manager for IT Asset Monitor
This script manages websockify instances for different VNC targets
"""

import os
import sys
import time
import signal
import subprocess
import json
import threading
from pathlib import Path

class DynamicWebsockify:
    def __init__(self, base_port=6081, web_root="."):
        self.base_port = base_port
        self.web_root = web_root
        self.processes = {}  # {target: process}
        self.lock = threading.Lock()
        
    def start_websockify(self, target_host, target_port=5900, web_port=None):
        """Start websockify for a specific target"""
        if web_port is None:
            web_port = self.base_port
            
        target = f"{target_host}:{target_port}"
        
        with self.lock:
            # Kill existing process for this target
            if target in self.processes:
                self.stop_websockify(target)
            
            # Kill any process using the web_port
            self._kill_port_process(web_port)
            
            try:
                # Start new websockify process
                cmd = [
                    sys.executable, "-m", "websockify",
                    str(web_port),
                    target,
                    "--web", self.web_root,
                    "--verbose",
                    "--log-file", f"websockify-{target_host}-{target_port}.log"
                ]
                
                print(f"Starting websockify: {' '.join(cmd)}")
                
                process = subprocess.Popen(
                    cmd,
                    cwd=os.getcwd(),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                
                self.processes[target] = {
                    'process': process,
                    'web_port': web_port,
                    'target': target,
                    'start_time': time.time()
                }
                
                print(f"✅ Websockify started for {target} on port {web_port} (PID: {process.pid})")
                return True
                
            except Exception as e:
                print(f"❌ Failed to start websockify for {target}: {e}")
                return False
    
    def stop_websockify(self, target):
        """Stop websockify for a specific target"""
        with self.lock:
            if target in self.processes:
                proc_info = self.processes[target]
                process = proc_info['process']
                
                try:
                    process.terminate()
                    process.wait(timeout=5)
                    print(f"✅ Websockify stopped for {target}")
                except subprocess.TimeoutExpired:
                    process.kill()
                    print(f"⚠️  Force killed websockify for {target}")
                except Exception as e:
                    print(f"❌ Error stopping websockify for {target}: {e}")
                
                del self.processes[target]
    
    def _kill_port_process(self, port):
        """Kill any process using the specified port"""
        try:
            if os.name == 'nt':  # Windows
                cmd = f"netstat -ano | findstr :{port}"
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
                if result.stdout:
                    for line in result.stdout.split('\n'):
                        if f":{port}" in line:
                            parts = line.split()
                            if len(parts) >= 5:
                                pid = parts[-1]
                                subprocess.run(f"taskkill /f /pid {pid}", shell=True)
            else:  # Unix/Linux
                cmd = f"lsof -ti:{port}"
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
                if result.stdout.strip():
                    pids = result.stdout.strip().split('\n')
                    for pid in pids:
                        subprocess.run(f"kill -9 {pid}", shell=True)
        except Exception as e:
            print(f"Warning: Could not kill process on port {port}: {e}")
    
    def get_status(self):
        """Get status of all websockify processes"""
        with self.lock:
            status = {}
            for target, proc_info in self.processes.items():
                process = proc_info['process']
                status[target] = {
                    'pid': process.pid,
                    'web_port': proc_info['web_port'],
                    'running': process.poll() is None,
                    'start_time': proc_info['start_time']
                }
            return status
    
    def cleanup(self):
        """Clean up all processes"""
        with self.lock:
            for target in list(self.processes.keys()):
                self.stop_websockify(target)

def main():
    """Main function for testing"""
    if len(sys.argv) < 2:
        print("Usage: python dynamic-websockify.py <target_host> [target_port] [web_port]")
        sys.exit(1)
    
    target_host = sys.argv[1]
    target_port = int(sys.argv[2]) if len(sys.argv) > 2 else 5900
    web_port = int(sys.argv[3]) if len(sys.argv) > 3 else 6081
    
    manager = DynamicWebsockify(base_port=web_port)
    
    # Handle Ctrl+C gracefully
    def signal_handler(sig, frame):
        print("\n🛑 Shutting down...")
        manager.cleanup()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    # Start websockify
    success = manager.start_websockify(target_host, target_port, web_port)
    
    if success:
        print(f"🎯 Websockify running for {target_host}:{target_port} on port {web_port}")
        print("Press Ctrl+C to stop")
        
        # Keep running
        try:
            while True:
                time.sleep(1)
                status = manager.get_status()
                for target, info in status.items():
                    if not info['running']:
                        print(f"⚠️  Process for {target} stopped unexpectedly")
        except KeyboardInterrupt:
            pass
    else:
        print("❌ Failed to start websockify")
        sys.exit(1)

if __name__ == "__main__":
    main()
