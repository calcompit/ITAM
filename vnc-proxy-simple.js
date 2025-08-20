import { WebSocketServer } from 'ws';
import net from 'net';
import http from 'http';

const VNC_PROXY_PORT = 8081;
const VNC_PROXY_HOST = '0.0.0.0';

// Create HTTP server for serving the VNC HTML page
const server = http.createServer((req, res) => {
  console.log('Request:', req.method, req.url);
  
  if (req.url === '/vnc.html' || req.url.startsWith('/vnc.html')) {
    console.log('Serving vnc.html');
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
            color: white;
        }
        #vnc-canvas {
            width: 100vw;
            height: 100vh;
            cursor: none;
            border: 1px solid #333;
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
        .status {
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div class="status">
        <h3>VNC Viewer Status</h3>
        <p>Server: Running</p>
        <p>Connection: <span id="connection-status">Disconnected</span></p>
    </div>
    
    <div class="vnc-controls">
        <button onclick="testConnection()">Test Connection</button>
        <button onclick="showInfo()">Show Info</button>
    </div>
    
    <canvas id="vnc-canvas"></canvas>

    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const ip = urlParams.get('ip') || 'localhost';
        const port = urlParams.get('port') || '5900';
        const password = urlParams.get('password') || '123';
        
        const canvas = document.getElementById('vnc-canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Fill with dark background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add welcome text
        ctx.fillStyle = '#00ff00';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VNC Viewer - Ready', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText('Target: ' + ip + ':' + port, canvas.width / 2, canvas.height / 2);
        ctx.fillText('Password: ' + password, canvas.width / 2, canvas.height / 2 + 30);
        
        function testConnection() {
            document.getElementById('connection-status').textContent = 'Testing...';
            
            // Try to connect to WebSocket
            const wsUrl = 'ws://' + window.location.hostname + ':8081/vnc-proxy?ip=' + ip + '&port=' + port;
            console.log('Testing connection to:', wsUrl);
            
            try {
                const ws = new WebSocket(wsUrl);
                
                ws.onopen = function() {
                    console.log('WebSocket connected!');
                    document.getElementById('connection-status').textContent = 'WebSocket Connected';
                    
                    // Update canvas
                    ctx.fillStyle = '#00ff00';
                    ctx.fillText('WebSocket Connected!', canvas.width / 2, canvas.height / 2 + 60);
                };
                
                ws.onerror = function(error) {
                    console.error('WebSocket error:', error);
                    document.getElementById('connection-status').textContent = 'WebSocket Error';
                    
                    // Update canvas
                    ctx.fillStyle = '#ff0000';
                    ctx.fillText('WebSocket Error', canvas.width / 2, canvas.height / 2 + 60);
                };
                
                ws.onclose = function() {
                    console.log('WebSocket closed');
                    document.getElementById('connection-status').textContent = 'WebSocket Closed';
                };
                
            } catch (error) {
                console.error('Connection error:', error);
                document.getElementById('connection-status').textContent = 'Connection Failed';
                
                // Update canvas
                ctx.fillStyle = '#ff0000';
                ctx.fillText('Connection Failed: ' + error.message, canvas.width / 2, canvas.height / 2 + 60);
            }
        }
        
        function showInfo() {
            alert('VNC Viewer Info:\\n' +
                  'Target IP: ' + ip + '\\n' +
                  'Target Port: ' + port + '\\n' +
                  'Password: ' + password + '\\n' +
                  'Current URL: ' + window.location.href);
        }
        
        // Auto-test connection after 2 seconds
        setTimeout(testConnection, 2000);
    </script>
</body>
</html>
    `);
  } else if (req.url === '/favicon.ico') {
    res.writeHead(404);
    res.end();
  } else {
    console.log('404 Not Found:', req.url);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found: ' + req.url);
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
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'info',
    message: 'Connected to VNC proxy',
    target: `${ip}:${port}`
  }));
  
  // Create TCP connection to VNC server
  const vncSocket = new net.Socket();
  
  vncSocket.connect(port, ip, () => {
    console.log(`Connected to VNC server ${ip}:${port}`);
    ws.send(JSON.stringify({
      type: 'status',
      message: 'Connected to VNC server',
      target: `${ip}:${port}`
    }));
  });
  
  // Handle VNC socket errors
  vncSocket.on('error', (err) => {
    console.error('VNC socket error:', err.message);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'VNC connection failed: ' + err.message
    }));
    ws.close();
  });
  
  // Handle WebSocket close
  ws.on('close', () => {
    console.log('VNC proxy WebSocket closed');
    vncSocket.destroy();
  });
  
  // Handle WebSocket errors
  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
    vncSocket.destroy();
  });
});

// Start the server
server.listen(VNC_PROXY_PORT, VNC_PROXY_HOST, () => {
  console.log(`VNC proxy server running on http://${VNC_PROXY_HOST}:${VNC_PROXY_PORT}`);
  console.log('VNC HTML page available at: http://10.51.101.49:8081/vnc.html');
  console.log('Simple test page available at: http://10.51.101.49:8081/vnc.html');
});
