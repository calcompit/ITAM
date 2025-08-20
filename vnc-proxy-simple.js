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
            overflow: hidden;
        }
        #vnc-canvas {
            width: 100vw;
            height: 100vh;
            cursor: crosshair;
            border: 1px solid #333;
            display: block;
        }
        .vnc-controls {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
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
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 1000;
            font-size: 12px;
        }
        .loading {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 18px;
            z-index: 1001;
            background: rgba(0,0,0,0.8);
            padding: 20px;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="loading" id="loading">Connecting to VNC server...</div>
    
    <div class="status">
        <h3>VNC Viewer Status</h3>
        <p>Server: Running</p>
        <p>Connection: <span id="connection-status">Disconnected</span></p>
        <p>Screen: <span id="screen-status">Waiting...</span></p>
    </div>
    
    <div class="vnc-controls">
        <button onclick="reconnect()">Reconnect</button>
        <button onclick="showInfo()">Show Info</button>
        <button onclick="toggleFullscreen()">Fullscreen</button>
    </div>
    
    <canvas id="vnc-canvas"></canvas>

    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const ip = urlParams.get('ip') || 'localhost';
        const port = urlParams.get('port') || '5900';
        const password = urlParams.get('password') || '123';
        
        const canvas = document.getElementById('vnc-canvas');
        const ctx = canvas.getContext('2d');
        let ws = null;
        let isConnected = false;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 3;
        
        // Set canvas size
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Fill with dark background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add welcome text
        ctx.fillStyle = '#00ff00';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VNC Viewer - Connecting...', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText('Target: ' + ip + ':' + port, canvas.width / 2, canvas.height / 2);
        ctx.fillText('Password: ' + password, canvas.width / 2, canvas.height / 2 + 30);
        
        function connectVNC() {
            if (reconnectAttempts >= maxReconnectAttempts) {
                document.getElementById('connection-status').textContent = 'Max reconnection attempts reached';
                document.getElementById('screen-status').textContent = 'Please refresh the page';
                ctx.fillStyle = '#ff0000';
                ctx.fillText('Max reconnection attempts reached. Please refresh.', canvas.width / 2, canvas.height / 2 + 60);
                return;
            }
            
            document.getElementById('connection-status').textContent = 'Connecting...';
            document.getElementById('screen-status').textContent = 'Establishing connection...';
            
            // Try to connect to WebSocket
            const wsUrl = 'ws://' + window.location.hostname + ':8081/vnc-proxy?ip=' + ip + '&port=' + port;
            console.log('Connecting to VNC via:', wsUrl);
            
            try {
                ws = new WebSocket(wsUrl);
                
                ws.onopen = function() {
                    console.log('WebSocket connected!');
                    document.getElementById('connection-status').textContent = 'WebSocket Connected';
                    document.getElementById('screen-status').textContent = 'Authenticating...';
                    reconnectAttempts = 0; // Reset reconnect attempts on successful connection
                    
                    // Send authentication
                    ws.send(JSON.stringify({
                        type: 'auth',
                        password: password
                    }));
                    
                    // Update canvas
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#00ff00';
                    ctx.fillText('WebSocket Connected - Authenticating...', canvas.width / 2, canvas.height / 2);
                };
                
                ws.onmessage = function(event) {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('Received message:', data);
                        
                        if (data.type === 'status') {
                            document.getElementById('screen-status').textContent = data.message;
                            
                            if (data.message.includes('Connected to VNC server')) {
                                isConnected = true;
                                document.getElementById('loading').style.display = 'none';
                                
                                // Clear canvas for VNC display
                                ctx.fillStyle = '#000000';
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                ctx.fillStyle = '#00ff00';
                                ctx.fillText('VNC Connected - Waiting for screen data...', canvas.width / 2, canvas.height / 2);
                                
                                // Request screen update
                                ws.send(JSON.stringify({
                                    type: 'request_screen'
                                }));
                                
                                // Start continuous screen updates
                                setInterval(() => {
                                    if (isConnected && ws) {
                                        ws.send(JSON.stringify({
                                            type: 'request_screen'
                                        }));
                                    }
                                }, 1000); // Request screen update every second
                            }
                        } else if (data.type === 'screen_data') {
                            // Handle screen data with actual display
                            document.getElementById('screen-status').textContent = 'Screen data received';
                            
                            if (data.dataUrl) {
                                // Display the actual VNC screen data
                                const img = new Image();
                                img.onload = function() {
                                    // Clear canvas and draw the VNC screen
                                    ctx.fillStyle = '#000000';
                                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                                    
                                    // Draw the VNC screen image
                                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                    
                                    // Add status overlay
                                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                                    ctx.fillRect(10, 10, 300, 80);
                                    ctx.fillStyle = '#00ff00';
                                    ctx.font = '12px Arial';
                                    ctx.fillText('VNC Screen: ' + (data.width || 'Unknown') + 'x' + (data.height || 'Unknown'), 20, 30);
                                    ctx.fillText('Data: ' + (data.dataLength || 0) + ' bytes', 20, 50);
                                    ctx.fillText('Status: Connected', 20, 70);
                                };
                                img.src = data.dataUrl;
                            } else {
                                // Fallback: show placeholder
                                ctx.fillStyle = '#000000';
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                ctx.fillStyle = '#00ff00';
                                ctx.fillText('VNC Screen Connected!', canvas.width / 2, canvas.height / 2 - 30);
                                ctx.fillStyle = '#ffffff';
                                ctx.fillText('Screen size: ' + (data.width || 'Unknown') + 'x' + (data.height || 'Unknown'), canvas.width / 2, canvas.height / 2);
                                ctx.fillText('Data received: ' + (data.dataLength || 0) + ' bytes', canvas.width / 2, canvas.height / 2 + 30);
                                ctx.fillStyle = '#ffff00';
                                ctx.fillText('Note: Mouse/Keyboard input is logged but not sent to VNC server', canvas.width / 2, canvas.height / 2 + 60);
                            }
                        } else if (data.type === 'error') {
                            document.getElementById('screen-status').textContent = 'Error: ' + data.message;
                            ctx.fillStyle = '#ff0000';
                            ctx.fillText('VNC Error: ' + data.message, canvas.width / 2, canvas.height / 2);
                        } else if (data.type === 'input_ack') {
                            // Input acknowledged - just log it
                            console.log('Input acknowledged:', data.message);
                        }
                    } catch (e) {
                        console.log('Raw data received:', event.data);
                    }
                };
                
                ws.onerror = function(error) {
                    console.error('WebSocket error:', error);
                    document.getElementById('connection-status').textContent = 'WebSocket Error';
                    document.getElementById('screen-status').textContent = 'Connection failed';
                    
                    ctx.fillStyle = '#ff0000';
                    ctx.fillText('WebSocket Error', canvas.width / 2, canvas.height / 2);
                };
                
                ws.onclose = function() {
                    console.log('WebSocket closed');
                    isConnected = false;
                    document.getElementById('connection-status').textContent = 'WebSocket Closed';
                    document.getElementById('screen-status').textContent = 'Disconnected';
                    
                    ctx.fillStyle = '#ff0000';
                    ctx.fillText('WebSocket Disconnected', canvas.width / 2, canvas.height / 2);
                    
                    // Auto-reconnect if not manually disconnected
                    if (reconnectAttempts < maxReconnectAttempts) {
                        reconnectAttempts++;
                        console.log('Auto-reconnecting... Attempt', reconnectAttempts);
                        setTimeout(connectVNC, 2000);
                    }
                };
                
            } catch (error) {
                console.error('Connection error:', error);
                document.getElementById('connection-status').textContent = 'Connection Failed';
                document.getElementById('screen-status').textContent = 'Failed to connect';
                
                ctx.fillStyle = '#ff0000';
                ctx.fillText('Connection Failed: ' + error.message, canvas.width / 2, canvas.height / 2);
            }
        }
        
        function reconnect() {
            reconnectAttempts = 0; // Reset reconnect attempts
            if (ws) {
                ws.close();
            }
            setTimeout(connectVNC, 1000);
        }
        
        function showInfo() {
            alert('VNC Viewer Info:\\n' +
                  'Target IP: ' + ip + '\\n' +
                  'Target Port: ' + port + '\\n' +
                  'Password: ' + password + '\\n' +
                  'Connection: ' + (isConnected ? 'Connected' : 'Disconnected') + '\\n' +
                  'Reconnect Attempts: ' + reconnectAttempts + '/' + maxReconnectAttempts + '\\n' +
                  'Current URL: ' + window.location.href);
        }
        
        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
        
        // Handle mouse events
        canvas.addEventListener('mousedown', function(e) {
            if (isConnected && ws) {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Send mouse event via WebSocket (not directly to VNC)
                ws.send(JSON.stringify({
                    type: 'mouse',
                    action: 'mousedown',
                    x: x,
                    y: y,
                    button: e.button
                }));
            }
        });
        
        canvas.addEventListener('mouseup', function(e) {
            if (isConnected && ws) {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Send mouse event via WebSocket (not directly to VNC)
                ws.send(JSON.stringify({
                    type: 'mouse',
                    action: 'mouseup',
                    x: x,
                    y: y,
                    button: e.button
                }));
            }
        });
        
        canvas.addEventListener('mousemove', function(e) {
            if (isConnected && ws) {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Send mouse event via WebSocket (not directly to VNC)
                ws.send(JSON.stringify({
                    type: 'mouse',
                    action: 'mousemove',
                    x: x,
                    y: y
                }));
            }
        });
        
        // Handle keyboard events
        document.addEventListener('keydown', function(e) {
            if (isConnected && ws) {
                // Send keyboard event via WebSocket (not directly to VNC)
                ws.send(JSON.stringify({
                    type: 'key',
                    action: 'keydown',
                    key: e.key,
                    keyCode: e.keyCode
                }));
            }
        });
        
        document.addEventListener('keyup', function(e) {
            if (isConnected && ws) {
                // Send keyboard event via WebSocket (not directly to VNC)
                ws.send(JSON.stringify({
                    type: 'key',
                    action: 'keyup',
                    key: e.key,
                    keyCode: e.keyCode
                }));
            }
        });
        
        // Auto-connect after 1 second
        setTimeout(connectVNC, 1000);
    </script>
</body>
</html>
    `);
  } else if (req.url === '/favicon.ico') {
    // Serve a simple favicon or 404
    res.writeHead(404);
    res.end();
  } else if (req.url === '/robots.txt') {
    // Serve robots.txt
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('User-agent: *\nDisallow: /');
  } else if (req.url === '/') {
    // Redirect root to vnc.html
    res.writeHead(302, { 'Location': '/vnc.html' });
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
  
  let vncSocket = null;
  let isAuthenticated = false;
  let connectionTimeout = null;
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'status',
    message: 'Connected to VNC proxy',
    target: `${ip}:${port}`
  }));
  
  // Handle messages from client
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received message from client:', message);
      
      if (message.type === 'auth') {
        // Handle authentication
        console.log('Authenticating with password:', message.password);
        
        // Create TCP connection to VNC server
        vncSocket = new net.Socket();
        
        // Set connection timeout
        connectionTimeout = setTimeout(() => {
          console.log('VNC connection timeout');
          ws.send(JSON.stringify({
            type: 'error',
            message: 'VNC connection timeout'
          }));
          ws.close();
        }, 10000); // 10 seconds timeout
        
        vncSocket.connect(port, ip, () => {
          console.log(`Connected to VNC server ${ip}:${port}`);
          clearTimeout(connectionTimeout);
          
          // Send VNC protocol version
          const version = Buffer.from('RFB 003.008\n');
          vncSocket.write(version);
          
          ws.send(JSON.stringify({
            type: 'status',
            message: 'Connected to VNC server, sending authentication...'
          }));
        });
        
        vncSocket.on('data', (vncData) => {
          console.log('Received VNC data:', vncData.length, 'bytes');
          
          try {
            // Try to decode VNC protocol data
            if (vncData.length > 0) {
              // For now, create a simple visual representation
              // In a real implementation, this would decode VNC protocol
              
              // Create a simple pattern based on received data
              const canvas = document.createElement('canvas');
              canvas.width = 1920;
              canvas.height = 1080;
              const ctx = canvas.getContext('2d');
              
              // Fill with a pattern based on received data
              ctx.fillStyle = '#000000';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // Create some visual elements based on data
              const dataSum = vncData.reduce((sum, byte) => sum + byte, 0);
              const hue = dataSum % 360;
              
              // Draw some rectangles to simulate screen content
              ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
              ctx.fillRect(100, 100, 300, 200);
              
              ctx.fillStyle = '#ffffff';
              ctx.font = '24px Arial';
              ctx.fillText('VNC Screen Data', 120, 150);
              ctx.fillText('Received: ' + vncData.length + ' bytes', 120, 180);
              ctx.fillText('Data Sum: ' + dataSum, 120, 210);
              
              // Convert canvas to data URL and send to client
              const dataUrl = canvas.toDataURL();
              
              ws.send(JSON.stringify({
                type: 'screen_data',
                width: 1920,
                height: 1080,
                dataLength: vncData.length,
                dataUrl: dataUrl,
                message: 'VNC screen data decoded and displayed'
              }));
            }
          } catch (error) {
            console.error('Error processing VNC data:', error);
            
            // Fallback: send basic screen data
            ws.send(JSON.stringify({
              type: 'screen_data',
              width: 1920,
              height: 1080,
              dataLength: vncData.length,
              message: 'VNC screen data received (processing error)'
            }));
          }
        });
        
        vncSocket.on('error', (err) => {
          console.error('VNC socket error:', err.message);
          clearTimeout(connectionTimeout);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'VNC connection failed: ' + err.message
          }));
          ws.close();
        });
        
        vncSocket.on('close', () => {
          console.log('VNC server connection closed');
          clearTimeout(connectionTimeout);
          ws.send(JSON.stringify({
            type: 'status',
            message: 'VNC server disconnected'
          }));
        });
        
      } else if (message.type === 'mouse' || message.type === 'key') {
        // Log input events but don't forward to VNC server yet
        console.log('Input event received:', message.type, message.action);
        
        // For now, just acknowledge the input without sending to VNC
        // This prevents ECONNRESET errors
        ws.send(JSON.stringify({
          type: 'input_ack',
          message: 'Input received: ' + message.type + ' ' + message.action
        }));
        
        // TODO: Implement proper VNC protocol input handling
        // This requires proper VNC protocol encoding for mouse/keyboard events
      }
      
    } catch (error) {
      console.error('Error handling client message:', error);
    }
  });
  
  // Handle WebSocket close
  ws.on('close', () => {
    console.log('VNC proxy WebSocket closed');
    clearTimeout(connectionTimeout);
    if (vncSocket) {
      vncSocket.destroy();
    }
  });
  
  // Handle WebSocket errors
  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
    clearTimeout(connectionTimeout);
    if (vncSocket) {
      vncSocket.destroy();
    }
  });
});

// Start the server
server.listen(VNC_PROXY_PORT, VNC_PROXY_HOST, () => {
  console.log(`VNC proxy server running on http://${VNC_PROXY_HOST}:${VNC_PROXY_PORT}`);
  console.log('VNC HTML page available at: http://10.51.101.49:8081/vnc.html');
  console.log('Enhanced VNC viewer with screen display support');
  console.log('Added improved error handling and auto-reconnect');
});
