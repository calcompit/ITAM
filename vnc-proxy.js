import { WebSocketServer } from 'ws';
import net from 'net';
import http from 'http';
import fs from 'fs';
import path from 'path';

const VNC_PROXY_PORT = 8081;
const VNC_PROXY_HOST = '0.0.0.0'; // Listen on all interfaces for Windows

// Create HTTP server for serving the VNC HTML page
const server = http.createServer((req, res) => {
  if (req.url === '/vnc.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web VNC Viewer</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            font-family: Arial, sans-serif;
        }
        #vnc-canvas {
            width: 100vw;
            height: 100vh;
            cursor: none;
        }
        .vnc-controls {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 1000;
        }
        .vnc-controls button {
            background: #007bff;
            color: white;
            border: none;
            padding: 5px 10px;
            margin: 2px;
            border-radius: 3px;
            cursor: pointer;
        }
        .vnc-controls button:hover {
            background: #0056b3;
        }
        .loading {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 18px;
            z-index: 1001;
        }
        .error {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ff6b6b;
            font-size: 16px;
            z-index: 1001;
            text-align: center;
            background: rgba(0,0,0,0.8);
            padding: 20px;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="loading" id="loading">Loading VNC viewer...</div>
    <div class="error" id="error" style="display: none;"></div>
    <div class="vnc-controls">
        <button onclick="connectVNC()">Connect</button>
        <button onclick="disconnectVNC()">Disconnect</button>
        <button onclick="toggleFullscreen()">Fullscreen</button>
        <div id="status">Disconnected</div>
    </div>
    <canvas id="vnc-canvas"></canvas>

    <!-- Load local noVNC library -->
    <script src="/novnc.js"></script>

    <script>
        let rfb = null;
        const urlParams = new URLSearchParams(window.location.search);
        const ip = urlParams.get('ip') || 'localhost';
        const port = urlParams.get('port') || '5901';
        const password = urlParams.get('password') || '123';

        // Wait for noVNC to load
        function waitForNoVNC() {
            if (typeof RFB !== 'undefined') {
                console.log('noVNC loaded successfully');
                document.getElementById('loading').style.display = 'none';
                // Auto-connect after a short delay
                setTimeout(connectVNC, 500);
            } else {
                setTimeout(waitForNoVNC, 100);
            }
        }

        function showError(message) {
            document.getElementById('loading').style.display = 'none';
            const errorDiv = document.getElementById('error');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }

        function connectVNC() {
            try {
                // Use the VNC proxy WebSocket endpoint
                const wsUrl = \`ws://\${window.location.hostname}:8081/vnc-proxy?ip=\${ip}&port=\${port}\`;
                console.log('Connecting to VNC via proxy:', wsUrl);
                
                if (typeof RFB === 'undefined') {
                    throw new Error('noVNC library not loaded. Please refresh the page.');
                }
                
                rfb = new RFB(document.getElementById('vnc-canvas'), wsUrl, {
                    credentials: { password: password },
                    repeaterID: '',
                    wsProtocols: ['binary'],
                    clipViewport: false,
                    scaleViewport: false,
                    resizeSession: true,
                    qualityLevel: 6,
                    compressionLevel: 2,
                });

                rfb.addEventListener('connect', () => {
                    console.log('VNC Connected!');
                    document.getElementById('status').textContent = 'Connected';
                    // Enable input handling
                    rfb.enableInput();
                });

                rfb.addEventListener('disconnect', () => {
                    console.log('VNC Disconnected');
                    document.getElementById('status').textContent = 'Disconnected';
                });

                rfb.addEventListener('error', (err) => {
                    console.error('VNC Error:', err);
                    const errorMsg = err.detail?.message || err.message || 'Unknown error';
                    document.getElementById('status').textContent = 'Error: ' + errorMsg;
                    showError('VNC Connection Error: ' + errorMsg);
                });

            } catch (err) {
                console.error('Failed to connect VNC:', err);
                const errorMsg = err.message || 'Unknown error';
                document.getElementById('status').textContent = 'Failed to connect: ' + errorMsg;
                showError('Failed to connect: ' + errorMsg);
            }
        }

        function disconnectVNC() {
            if (rfb) {
                rfb.disconnect();
                rfb = null;
                document.getElementById('status').textContent = 'Disconnected';
            }
        }

        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }

        // Start loading process when page loads
        window.addEventListener('load', () => {
            waitForNoVNC();
        });
    </script>
</body>
</html>
    `);
  } else if (req.url === '/novnc.js') {
    // Serve the local noVNC library
    try {
      const novncPath = path.join(process.cwd(), 'public', 'novnc.js');
      const content = fs.readFileSync(novncPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(content);
    } catch (error) {
      console.error('Error serving novnc.js:', error);
      res.writeHead(404);
      res.end('Not Found');
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Create WebSocket server for VNC proxy
const wss = new WebSocketServer({ 
  server: server,
  path: '/vnc-proxy'
});

// Handle WebSocket connections for VNC proxy
wss.on('connection', (ws, req) => {
  console.log('VNC proxy WebSocket connection established');
  
  // Parse query parameters
  const url = new URL(req.url, `http://${req.headers.host}`);
  const ip = url.searchParams.get('ip') || 'localhost';
  const port = parseInt(url.searchParams.get('port')) || 5901;
  
  console.log(`VNC proxy connecting to ${ip}:${port}`);
  
  // Create TCP connection to VNC server
  const vncSocket = new net.Socket();
  
  vncSocket.connect(port, ip, () => {
    console.log(`Connected to VNC server ${ip}:${port}`);
  });
  
  // Forward data from WebSocket to VNC server
  ws.on('message', (data) => {
    if (vncSocket.writable) {
      try {
        // Handle JSON messages from the client
        if (typeof data === 'string') {
          try {
            const jsonData = JSON.parse(data);
            // Convert JSON messages to appropriate VNC protocol
            if (jsonData.type === 'mouse') {
              // Convert mouse events to VNC protocol
              const vncData = Buffer.alloc(6);
              vncData.writeUInt8(5, 0); // Message type: pointer event
              vncData.writeUInt8(jsonData.button || 0, 1); // Button mask
              vncData.writeUInt16BE(jsonData.x || 0, 2); // X position
              vncData.writeUInt16BE(jsonData.y || 0, 4); // Y position
              vncSocket.write(vncData);
            } else if (jsonData.type === 'key') {
              // Convert key events to VNC protocol
              const vncData = Buffer.alloc(8);
              vncData.writeUInt8(4, 0); // Message type: key event
              vncData.writeUInt8(jsonData.action === 'keydown' ? 1 : 0, 1); // Down flag
              vncData.writeUInt16BE(0, 2); // Padding
              vncData.writeUInt32BE(jsonData.keyCode || 0, 4); // Key code
              vncSocket.write(vncData);
            }
          } catch (e) {
            // If not JSON, treat as raw data
            vncSocket.write(data);
          }
        } else {
          // Binary data - forward directly
          vncSocket.write(data);
        }
      } catch (error) {
        console.error('Error forwarding data to VNC:', error);
      }
    }
  });
  
  // Forward data from VNC server to WebSocket
  vncSocket.on('data', (data) => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        ws.send(data);
      } catch (error) {
        console.error('Error forwarding data to WebSocket:', error);
      }
    }
  });
  
  // Handle WebSocket close
  ws.on('close', () => {
    console.log('VNC proxy WebSocket closed');
    vncSocket.destroy();
  });
  
  // Handle VNC socket close
  vncSocket.on('close', () => {
    console.log('VNC server connection closed');
    if (ws.readyState === 1) {
      ws.close();
    }
  });
  
  // Handle errors
  vncSocket.on('error', (err) => {
    console.error('VNC socket error:', err.message);
    if (ws.readyState === 1) {
      ws.close();
    }
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
    vncSocket.destroy();
  });
});

// Start the server
server.listen(VNC_PROXY_PORT, VNC_PROXY_HOST, () => {
  console.log(`VNC proxy server running on http://${VNC_PROXY_HOST}:${VNC_PROXY_PORT}`);
  console.log('VNC HTML page available at: http://10.51.101.49:8081/vnc.html');
});
