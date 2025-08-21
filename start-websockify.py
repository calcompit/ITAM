#!/usr/bin/env python3
"""
Simple WebSocket to TCP proxy for VNC
Usage: python start-websockify.py <port> <target_host:port>
"""

import sys
import socket
import select
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

class WebSocketHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>VNC Proxy</title>
            </head>
            <body>
                <h1>VNC WebSocket Proxy</h1>
                <p>Target: 172.17.124.179:5900</p>
                <p>Status: Running</p>
            </body>
            </html>
            """
            
            self.wfile.write(html.encode())
        else:
            self.send_response(404)
            self.end_headers()

def proxy_websocket(ws_sock, target_host, target_port):
    """Proxy WebSocket to TCP"""
    try:
        # Connect to target VNC server
        target_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        target_sock.connect((target_host, target_port))
        print(f"Connected to VNC server: {target_host}:{target_port}")
        
        # Proxy data between WebSocket and TCP
        while True:
            readable, _, _ = select.select([ws_sock, target_sock], [], [], 1)
            
            for sock in readable:
                try:
                    data = sock.recv(4096)
                    if not data:
                        return
                    
                    # Send data to the other socket
                    other_sock = target_sock if sock is ws_sock else ws_sock
                    other_sock.send(data)
                    
                except Exception as e:
                    print(f"Error in proxy: {e}")
                    return
                    
    except Exception as e:
        print(f"Error connecting to target: {e}")
    finally:
        try:
            target_sock.close()
        except:
            pass

def main():
    if len(sys.argv) != 3:
        print("Usage: python start-websockify.py <port> <target_host:port>")
        sys.exit(1)
    
    port = int(sys.argv[1])
    target = sys.argv[2]
    
    if ':' not in target:
        print("Target must be in format: host:port")
        sys.exit(1)
    
    target_host, target_port = target.split(':')
    target_port = int(target_port)
    
    print(f"Starting WebSocket proxy on port {port}")
    print(f"Target: {target_host}:{target_port}")
    
    # Start HTTP server
    server = HTTPServer(('0.0.0.0', port), WebSocketHandler)
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.daemon = True
    server_thread.start()
    
    print(f"HTTP server started on port {port}")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()

if __name__ == '__main__':
    main()
