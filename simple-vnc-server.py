#!/usr/bin/env python3
"""
Simple VNC Server with HTML interface
"""
import subprocess
import sys
import time
import socket
import os
import http.server
import socketserver
import threading
import urllib.parse

def check_port(port):
    """Check if port is available"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('localhost', port))
            return True
    except OSError:
        return False

def create_vnc_html():
    """Create a simple VNC HTML interface"""
    html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>VNC Viewer</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .status { margin-top: 20px; padding: 10px; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    </style>
</head>
<body>
    <div class="container">
        <h1>VNC Viewer</h1>
        <form id="vncForm">
            <div class="form-group">
                <label for="host">Host:</label>
                <input type="text" id="host" name="host" value="10.51.101.83" required>
            </div>
            <div class="form-group">
                <label for="port">Port:</label>
                <input type="number" id="port" name="port" value="5900" required>
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" value="123">
            </div>
            <button type="submit">Connect to VNC</button>
        </form>
        <div id="status" class="status" style="display: none;"></div>
    </div>
    
    <script>
        document.getElementById('vncForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const host = document.getElementById('host').value;
            const port = document.getElementById('port').value;
            const password = document.getElementById('password').value;
            
            const statusDiv = document.getElementById('status');
            statusDiv.style.display = 'block';
            statusDiv.className = 'status success';
            statusDiv.innerHTML = 'Connecting to VNC server...<br>Host: ' + host + ':' + port;
            
            // Try to connect using websockify
            const wsUrl = 'ws://localhost:6081/websockify';
            const ws = new WebSocket(wsUrl);
            
            ws.onopen = function() {
                statusDiv.innerHTML = 'WebSocket connected! VNC connection established.';
            };
            
            ws.onerror = function(error) {
                statusDiv.className = 'status error';
                statusDiv.innerHTML = 'Connection failed. Please check if the VNC server is running and websockify is started.';
            };
            
            ws.onclose = function() {
                statusDiv.className = 'status error';
                statusDiv.innerHTML = 'Connection closed.';
            };
        });
    </script>
</body>
</html>
"""
    
    # Write HTML file
    with open('vnc.html', 'w') as f:
        f.write(html_content)
    
    print("✅ Created vnc.html")

def start_websockify(host="10.51.101.83", port=5900, web_port=6081):
    """Start websockify process"""
    print(f"Starting websockify for {host}:{port} on port {web_port}")
    
    cmd = [
        sys.executable, "-m", "websockify",
        str(web_port),
        f"{host}:{port}",
        "--verbose"
    ]
    
    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print(f"✅ Websockify started with PID: {process.pid}")
        return process
    except Exception as e:
        print(f"❌ Failed to start websockify: {e}")
        return None

def start_http_server(port=6081):
    """Start HTTP server to serve VNC HTML"""
    class VNCHandler(http.server.SimpleHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/':
                self.path = '/vnc.html'
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
    
    try:
        with socketserver.TCPServer(("", port), VNCHandler) as httpd:
            print(f"✅ HTTP server started on port {port}")
            print(f"📋 Access VNC at: http://localhost:{port}")
            httpd.serve_forever()
    except Exception as e:
        print(f"❌ Failed to start HTTP server: {e}")

def main():
    print("=== Simple VNC Server ===")
    
    # Check prerequisites
    try:
        import websockify
        print("✅ websockify is installed")
    except ImportError:
        print("❌ websockify is not installed")
        print("Please run: pip install websockify")
        return
    
    # Check port
    if not check_port(6081):
        print("❌ Port 6081 is in use")
        return
    
    print("✅ Port 6081 is available")
    
    # Create VNC HTML
    create_vnc_html()
    
    # Start websockify
    websockify_process = start_websockify()
    if not websockify_process:
        return
    
    # Wait a moment for websockify to start
    time.sleep(2)
    
    # Start HTTP server
    print("\n🎉 VNC server is ready!")
    print("📋 Access URLs:")
    print(f"  - VNC Interface: http://localhost:6081")
    print(f"  - Direct VNC: http://localhost:6081/vnc.html")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        start_http_server()
    except KeyboardInterrupt:
        print("\n🛑 Stopping VNC server...")
        websockify_process.terminate()
        websockify_process.wait()
        print("✅ VNC server stopped")

if __name__ == "__main__":
    main()
