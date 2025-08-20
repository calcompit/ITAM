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
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: bold; color: #333; }
        input, select { width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
        input:focus, select:focus { border-color: #007bff; outline: none; }
        button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold; }
        button:hover { background: #0056b3; }
        button:disabled { background: #6c757d; cursor: not-allowed; }
        .status { margin-top: 20px; padding: 15px; border-radius: 6px; font-weight: bold; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        .connection-info { background: #e2e3e5; padding: 15px; border-radius: 6px; margin-top: 20px; }
        .connection-info h3 { margin-top: 0; color: #495057; }
        .connection-info p { margin: 5px 0; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <h1>VNC Viewer</h1>
        <p>Connect to a VNC server using WebSocket proxy</p>
        
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
            <button type="submit" id="connectBtn">Connect to VNC</button>
        </form>
        
        <div id="status" class="status" style="display: none;"></div>
        
        <div class="connection-info">
            <h3>Connection Information</h3>
            <p><strong>WebSocket Proxy:</strong> ws://localhost:6081/websockify</p>
            <p><strong>VNC Interface:</strong> http://localhost:8081</p>
            <p><strong>Default Password:</strong> 123</p>
        </div>
    </div>
    
    <script>
        const form = document.getElementById('vncForm');
        const statusDiv = document.getElementById('status');
        const connectBtn = document.getElementById('connectBtn');
        let ws = null;
        
        function showStatus(message, type) {
            statusDiv.style.display = 'block';
            statusDiv.className = 'status ' + type;
            statusDiv.innerHTML = message;
        }
        
        function setButtonState(disabled, text) {
            connectBtn.disabled = disabled;
            connectBtn.textContent = text;
        }
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const host = document.getElementById('host').value;
            const port = document.getElementById('port').value;
            const password = document.getElementById('password').value;
            
            // Close existing connection
            if (ws) {
                ws.close();
            }
            
            setButtonState(true, 'Connecting...');
            showStatus('Connecting to VNC server...<br>Host: ' + host + ':' + port, 'info');
            
            // Try to connect using websockify
            const wsUrl = 'ws://localhost:6081/websockify';
            
            try {
                ws = new WebSocket(wsUrl);
                
                ws.onopen = function() {
                    showStatus('SUCCESS: WebSocket connected! VNC connection established.<br>You can now use a VNC client to connect to ' + host + ':' + port, 'success');
                    setButtonState(false, 'Connect to VNC');
                };
                
                ws.onerror = function(error) {
                    showStatus('ERROR: Connection failed. Please check:<br>1. VNC server is running on ' + host + ':' + port + '<br>2. websockify is started<br>3. Password is correct', 'error');
                    setButtonState(false, 'Connect to VNC');
                };
                
                ws.onclose = function() {
                    showStatus('Connection closed.', 'info');
                    setButtonState(false, 'Connect to VNC');
                };
                
            } catch (error) {
                showStatus('ERROR: Failed to create WebSocket connection: ' + error.message, 'error');
                setButtonState(false, 'Connect to VNC');
            }
        });
        
        // Show initial status
        showStatus('Ready to connect. Enter VNC server details and click Connect.', 'info');
    </script>
</body>
</html>
"""
    
    # Write HTML file with UTF-8 encoding
    with open('vnc.html', 'w', encoding='utf-8') as f:
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

def start_http_server(port=8081):
    """Start HTTP server to serve VNC HTML"""
    class VNCHandler(http.server.SimpleHTTPRequestHandler):
        def do_GET(self):
            # Handle root path
            if self.path == '/':
                self.path = '/vnc.html'
            
            # Handle vnc.html path
            if self.path == '/vnc.html':
                try:
                    with open('vnc.html', 'rb') as f:
                        content = f.read()
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html')
                    self.send_header('Content-Length', str(len(content)))
                    self.end_headers()
                    self.wfile.write(content)
                    return
                except FileNotFoundError:
                    self.send_error(404, 'vnc.html not found')
                    return
            
            # Handle other requests
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        
        def log_message(self, format, *args):
            # Suppress logging for cleaner output
            pass
    
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
    
    # Check ports
    if not check_port(6081):
        print("❌ Port 6081 is in use")
        return
    
    if not check_port(8081):
        print("❌ Port 8081 is in use")
        return
    
    print("✅ Ports 6081 and 8081 are available")
    
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
    print(f"  - VNC Interface: http://localhost:8081")
    print(f"  - Direct VNC: http://localhost:8081/vnc.html")
    print(f"  - WebSocket Proxy: ws://localhost:6081/websockify")
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
