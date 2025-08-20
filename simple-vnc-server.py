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
    # Check if vnc-simple.html exists, if not create it
    if os.path.exists('vnc-simple.html'):
        print("✅ Using existing vnc-simple.html")
        return
    
    print("✅ vnc-simple.html not found, creating...")
    # The HTML content will be created by the separate file
    # For now, just create an empty file
    with open('vnc-simple.html', 'w', encoding='utf-8') as f:
        f.write("<!-- VNC HTML file will be created separately -->")
    
    print("✅ Created vnc-simple.html")

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
                self.path = '/vnc-simple.html'
            
            # Handle vnc-simple.html path
            if self.path == '/vnc-simple.html':
                try:
                    with open('vnc-simple.html', 'rb') as f:
                        content = f.read()
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self.send_header('Content-Length', str(len(content)))
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                    self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                    self.end_headers()
                    self.wfile.write(content)
                    return
                except FileNotFoundError:
                    self.send_error(404, 'vnc-simple.html not found')
                    return
            
            # Handle other requests
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        
        def do_POST(self):
            """Handle POST requests"""
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status": "ok"}')
        
        def do_OPTIONS(self):
            """Handle OPTIONS requests for CORS"""
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
        
        def log_message(self, format, *args):
            # Suppress logging for cleaner output
            pass
    
    try:
        # Allow reuse of address to prevent "Address already in use" error
        socketserver.TCPServer.allow_reuse_address = True
        
        with socketserver.TCPServer(("", port), VNCHandler) as httpd:
            print(f"✅ HTTP server started on port {port}")
            print(f"📋 Access VNC at: http://localhost:{port}")
            print("Server is running... Press Ctrl+C to stop")
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
    print("\nServer is running... Press Ctrl+C to stop")
    
    try:
        start_http_server()
    except KeyboardInterrupt:
        print("\n🛑 Stopping VNC server...")
        try:
            websockify_process.terminate()
            websockify_process.wait(timeout=5)
            print("✅ Websockify stopped")
        except:
            print("⚠️  Force killing websockify...")
            websockify_process.kill()
        print("✅ VNC server stopped")
    except Exception as e:
        print(f"❌ Server error: {e}")
        try:
            websockify_process.terminate()
            websockify_process.wait(timeout=5)
        except:
            websockify_process.kill()

if __name__ == "__main__":
    main()
