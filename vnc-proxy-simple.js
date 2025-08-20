import { WebSocketServer } from 'ws';
import net from 'net';
import http from 'http';
import { exec } from 'child_process';
import { spawn } from 'child_process';

const VNC_PROXY_PORT = 8081;
const VNC_PROXY_HOST = '0.0.0.0';

// Create HTTP server for serving the VNC launcher page
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
    <title>VNC Launcher - IT Asset Monitor</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .container {
            background: white;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 600px;
            width: 100%;
        }
        
        h1 {
            color: #333;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        
        .vnc-info {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }
        
        .vnc-info h3 {
            color: #495057;
            margin-top: 0;
        }
        
        .vnc-info p {
            margin: 10px 0;
            color: #6c757d;
        }
        
        .vnc-info strong {
            color: #495057;
        }
        
        .launch-button {
            background: linear-gradient(45deg, #28a745, #20c997);
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 1.2em;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 10px;
            text-decoration: none;
            display: inline-block;
        }
        
        .launch-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .launch-button:active {
            transform: translateY(0);
        }
        
        .manual-button {
            background: linear-gradient(45deg, #007bff, #6610f2);
            color: white;
            border: none;
            padding: 12px 25px;
            font-size: 1em;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 10px;
            text-decoration: none;
            display: inline-block;
        }
        
        .manual-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        }
        
        .status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            font-weight: bold;
        }
        
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .status.info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        .instructions {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
        }
        
        .instructions h4 {
            color: #856404;
            margin-top: 0;
        }
        
        .instructions ol {
            color: #856404;
            margin: 10px 0;
            padding-left: 20px;
        }
        
        .instructions li {
            margin: 5px 0;
        }
        
        .back-link {
            display: inline-block;
            margin-top: 20px;
            color: #007bff;
            text-decoration: none;
            font-weight: bold;
        }
        
        .back-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🖥️ VNC Launcher</h1>
        
        <div class="vnc-info">
            <h3>📋 Connection Information</h3>
            <p><strong>Target IP:</strong> <span id="vnc-ip">10.51.101.83</span></p>
            <p><strong>Port:</strong> <span id="vnc-port">5900</span></p>
            <p><strong>Password:</strong> <span id="vnc-password">123</span></p>
            <p><strong>VNC Client:</strong> TightVNC Viewer</p>
        </div>
        
        <div class="instructions">
            <h4>📝 Instructions:</h4>
            <ol>
                <li>Click the "Launch TightVNC" button below</li>
                <li>If prompted, allow the application to run</li>
                <li>TightVNC will automatically connect to the target machine</li>
                <li>If automatic launch fails, use the manual command</li>
            </ol>
        </div>
        
        <button class="launch-button" onclick="launchTightVNC()">
            🚀 Launch TightVNC
        </button>
        
        <br>
        
        <button class="manual-button" onclick="showManualCommand()">
            📋 Show Manual Command
        </button>
        
        <button class="manual-button" onclick="copyCommand()">
            📋 Copy Command
        </button>
        
        <button class="manual-button" onclick="downloadTightVNC()">
            📥 Download TightVNC
        </button>
        
        <div id="status" class="status" style="display: none;"></div>
        
        <div id="manual-command" style="display: none; margin-top: 20px;">
            <div class="vnc-info">
                <h3>🔧 Manual Command</h3>
                <p>If automatic launch doesn't work, run this command in Command Prompt:</p>
                <code style="background: #f8f9fa; padding: 10px; border-radius: 5px; display: block; margin: 10px 0; font-family: monospace;">
                    "C:\\Program Files\\TightVNC\\tvnviewer.exe" -host=10.51.101.83 -port=5900 -password=123
                </code>
            </div>
        </div>
        
        <div id="download-info" style="display: none; margin-top: 20px;">
            <div class="vnc-info">
                <h3>📥 TightVNC Installation</h3>
                <p><strong>Step 1:</strong> Download TightVNC Viewer from the official website:</p>
                <p><a href="https://www.tightvnc.com/download.php" target="_blank" style="color: #007bff; text-decoration: none;">https://www.tightvnc.com/download.php</a></p>
                <p><strong>Step 2:</strong> Install TightVNC Viewer (Viewer only, not server)</p>
                <p><strong>Step 3:</strong> After installation, try launching VNC again</p>
                <p><strong>Note:</strong> Make sure to install the "Viewer" component, not the "Server" component</p>
            </div>
        </div>
        
        <a href="index.html" class="back-link">← Back to Dashboard</a>
    </div>

    <script>
        // Get VNC parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const ip = urlParams.get('ip') || '10.51.101.83';
        const port = urlParams.get('port') || '5900';
        const password = urlParams.get('password') || '123';
        
        // Update display
        document.getElementById('vnc-ip').textContent = ip;
        document.getElementById('vnc-port').textContent = port;
        document.getElementById('vnc-password').textContent = password;
        
        function showStatus(message, type) {
            const statusDiv = document.getElementById('status');
            statusDiv.textContent = message;
            statusDiv.className = \`status \${type}\`;
            statusDiv.style.display = 'block';
            
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
        
        function launchTightVNC() {
            try {
                // Multiple possible TightVNC paths
                const possiblePaths = [
                    'C:\\\\Program Files\\\\TightVNC\\\\tvnviewer.exe',
                    'C:\\\\Program Files (x86)\\\\TightVNC\\\\tvnviewer.exe',
                    'C:\\\\TightVNC\\\\tvnviewer.exe',
                    'C:\\\\Program Files\\\\TightVNC\\\\tvnviewer64.exe'
                ];
                
                const command = \`"\${possiblePaths[0]}" -host=\${ip} -port=\${port} -password=\${password}\`;
                
                // Method 1: Use ActiveX (Windows only) - Most reliable
                try {
                    if (typeof ActiveXObject !== 'undefined') {
                        const shell = new ActiveXObject('WScript.Shell');
                        shell.Run(command, 1, false);
                        showStatus('✅ TightVNC launched successfully via ActiveX!', 'success');
                        return;
                    }
                } catch (e) {
                    console.log('ActiveX method failed:', e);
                }
                
                // Method 2: Try to open TightVNC directly via file protocol
                try {
                    for (let path of possiblePaths) {
                        const fileUrl = \`file:///\${path.replace(/\\\\/g, '/')}\`;
                        const newWindow = window.open(fileUrl, '_blank');
                        if (newWindow && !newWindow.closed) {
                            showStatus('📁 Opened TightVNC folder. Please run the viewer manually.', 'info');
                            setTimeout(() => {
                                showManualCommand();
                            }, 2000);
                            return;
                        }
                    }
                } catch (e) {
                    console.log('File protocol method failed:', e);
                }
                
                // Method 3: Use protocol handler (less reliable)
                try {
                    window.location.href = \`tightvnc://\${ip}:\${port}?password=\${password}\`;
                    showStatus('🔄 Attempting to launch TightVNC via protocol...', 'info');
                    
                    // Fallback after 3 seconds if protocol doesn't work
                    setTimeout(() => {
                        showStatus('❌ Protocol launch failed. Please use manual command.', 'error');
                        showManualCommand();
                    }, 3000);
                    return;
                } catch (e) {
                    console.log('Protocol handler method failed:', e);
                }
                
                // Method 4: Try server-side launch
                try {
                    fetch(\`/launch-vnc?ip=\${ip}&port=\${port}&password=\${password}\`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                showStatus('✅ TightVNC launched via server!', 'success');
                            } else {
                                showStatus('❌ Server launch failed: ' + data.error, 'error');
                                showManualCommand();
                            }
                        })
                        .catch(error => {
                            console.log('Server launch failed:', error);
                            showStatus('❌ Server launch failed. Please use manual command.', 'error');
                            showManualCommand();
                        });
                    return;
                } catch (e) {
                    console.log('Server-side method failed:', e);
                }
                
                // If all methods fail
                showStatus('❌ Could not launch TightVNC automatically. Please use manual command.', 'error');
                showManualCommand();
                
            } catch (error) {
                console.error('Error launching TightVNC:', error);
                showStatus('❌ Error launching TightVNC: ' + error.message, 'error');
                showManualCommand();
            }
        }
        
        function showManualCommand() {
            const manualDiv = document.getElementById('manual-command');
            manualDiv.style.display = 'block';
            
            // Update the command with current parameters
            const commandElement = manualDiv.querySelector('code');
            commandElement.textContent = \`"C:\\\\Program Files\\\\TightVNC\\\\tvnviewer.exe" -host=\${ip} -port=\${port} -password=\${password}\`;
        }
        
        function copyCommand() {
            const command = \`"C:\\\\Program Files\\\\TightVNC\\\\tvnviewer.exe" -host=\${ip} -port=\${port} -password=\${password}\`;
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(command).then(() => {
                    showStatus('📋 Command copied to clipboard!', 'success');
                }).catch(() => {
                    showStatus('❌ Failed to copy command', 'error');
                });
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = command;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showStatus('📋 Command copied to clipboard!', 'success');
            }
        }
        
        function downloadTightVNC() {
            const downloadDiv = document.getElementById('download-info');
            downloadDiv.style.display = 'block';
            
            // Scroll to download info
            downloadDiv.scrollIntoView({ behavior: 'smooth' });
            
            showStatus('📥 Opening TightVNC download page...', 'info');
            
            // Open download page in new tab
            window.open('https://www.tightvnc.com/download.php', '_blank');
        }
        
        // Auto-launch on page load (optional)
        // Uncomment the line below if you want auto-launch
        // setTimeout(launchTightVNC, 1000);
    </script>
</body>
</html>
    `);
  } else if (req.url === '/favicon.ico') {
    res.writeHead(200, { 'Content-Type': 'image/x-icon' });
    res.end();
  } else if (req.url === '/robots.txt') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('User-agent: *\nDisallow: /');
  } else if (req.url === '/') {
    res.writeHead(302, { 'Location': '/vnc.html' });
    res.end();
  } else if (req.url.startsWith('/launch-vnc')) {
    // Handle server-side VNC launch
    const url = new URL(req.url, `http://${req.headers.host}`);
    const ip = url.searchParams.get('ip') || 'localhost';
    const port = url.searchParams.get('port') || '5900';
    const password = url.searchParams.get('password') || '123';
    
    console.log(`Attempting to launch TightVNC for ${ip}:${port}`);
    
    // Try multiple possible TightVNC paths
    const possiblePaths = [
      'C:\\Program Files\\TightVNC\\tvnviewer.exe',
      'C:\\Program Files (x86)\\TightVNC\\tvnviewer.exe',
      'C:\\TightVNC\\tvnviewer.exe',
      'C:\\Program Files\\TightVNC\\tvnviewer64.exe'
    ];
    
    let launchAttempted = false;
    let lastError = null;
    
    // Try each path
    for (let path of possiblePaths) {
      const command = `"${path}" -host=${ip} -port=${port} -password=${password}`;
      
      exec(command, (error, stdout, stderr) => {
        launchAttempted = true;
        
        if (error) {
          console.error(`Error launching TightVNC from ${path}:`, error.message);
          lastError = error.message;
          
          // If this was the last attempt, send error response
          if (path === possiblePaths[possiblePaths.length - 1]) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              success: false, 
              error: `Failed to launch TightVNC. Tried paths: ${possiblePaths.join(', ')}. Last error: ${lastError}`,
              command: command 
            }));
          }
        } else {
          console.log(`TightVNC launched successfully from ${path}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: true, 
            message: `TightVNC launched successfully from ${path}`,
            command: command 
          }));
          return;
        }
      });
    }
    
    // If no paths worked, send error after timeout
    setTimeout(() => {
      if (!launchAttempted) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'No TightVNC installation found. Please install TightVNC first.',
          paths: possiblePaths
        }));
      }
    }, 5000);
  } else {
    console.log('404 Not Found:', req.url);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found: ' + req.url + '\n\nAvailable endpoints:\n- /vnc.html\n- /vnc.html?ip=...&port=...&password=...\n- /launch-vnc?ip=...&port=...&password=...');
  }
});

// Create WebSocket server for VNC proxy (kept for potential future use)
const wss = new WebSocketServer({ 
  server: server,
  path: '/vnc-proxy'
});

// Handle WebSocket connections (minimal implementation for launcher)
wss.on('connection', (ws, req) => {
  console.log('VNC launcher WebSocket connection established');
  
  ws.send(JSON.stringify({
    type: 'status',
    message: 'VNC Launcher Ready'
  }));
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received message:', message);
      
      if (message.type === 'launch_vnc') {
        const { ip, port, password } = message;
        
        // Launch TightVNC on the server
        const tightVncPath = 'C:\\Program Files\\TightVNC\\tvnviewer.exe';
        const command = `"${tightVncPath}" -host=${ip} -port=${port} -password=${password}`;
        
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error('Error launching TightVNC:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to launch TightVNC: ' + error.message
            }));
          } else {
            console.log('TightVNC launched successfully');
            ws.send(JSON.stringify({
              type: 'success',
              message: 'TightVNC launched successfully'
            }));
          }
        });
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('VNC launcher WebSocket closed');
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
});

// Start the server
server.listen(VNC_PROXY_PORT, VNC_PROXY_HOST, () => {
  console.log(`VNC launcher server running on http://${VNC_PROXY_HOST}:${VNC_PROXY_PORT}`);
  console.log('VNC launcher page available at: http://10.51.101.49:8081/vnc.html');
  console.log('TightVNC launcher with automatic connection support');
  console.log('Supports both client-side and server-side VNC launching');
});
