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
                <li>VNC will launch automatically in a few seconds</li>
                <li>If TightVNC is not installed, download link will appear</li>
                <li>You can also use manual buttons below</li>
            </ol>
        </div>
        
        <div id="auto-launch-status" class="status info" style="display: block;">
            🔄 Checking TightVNC installation and preparing to launch...
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
        
        <button class="manual-button" onclick="checkInstallation()">
            🔍 Check Installation
        </button>
        
        <div id="status" class="status" style="display: none;"></div>
        
        <div id="manual-command" style="display: none; margin-top: 20px;">
            <div class="vnc-info">
                <h3>🔧 Manual Commands</h3>
                <p>If automatic launch doesn't work, try these commands in Command Prompt:</p>
                <code style="background: #f8f9fa; padding: 10px; border-radius: 5px; display: block; margin: 10px 0; font-family: monospace;">
                    "C:\\Program Files\\TightVNC\\tvnviewer.exe" -host=10.51.101.83 -port=5900 -password=123
                </code>
            </div>
        </div>
        
        <div id="download-info" style="display: none; margin-top: 20px;">
            <div class="vnc-info">
                <h3>📥 TightVNC Installation Guide</h3>
                <p><strong>Step 1:</strong> Download TightVNC Viewer from the official website:</p>
                <p><a href="https://www.tightvnc.com/download.php" target="_blank" style="color: #007bff; text-decoration: none;">https://www.tightvnc.com/download.php</a></p>
                <p><strong>Step 2:</strong> Install TightVNC Viewer (Viewer only, not server)</p>
                <p><strong>Step 3:</strong> After installation, try launching VNC again</p>
                <p><strong>Important Notes:</strong></p>
                <ul style="margin-left: 20px; color: #721c24;">
                    <li>Install the "Viewer" component, NOT the "Server" component</li>
                    <li>Make sure to install in the default location</li>
                    <li>Restart your browser after installation</li>
                    <li>Allow the application to run when prompted by Windows</li>
                </ul>
            </div>
        </div>
        
        <div id="installation-status" style="display: none; margin-top: 20px;">
            <div class="vnc-info">
                <h3>🔍 Installation Status</h3>
                <div id="status-content">
                    Checking TightVNC installation...
                </div>
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
            const autoLaunchStatus = document.getElementById('auto-launch-status');
            
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
                        autoLaunchStatus.textContent = '✅ TightVNC launched successfully!';
                        autoLaunchStatus.className = 'status success';
                        return;
                    }
                } catch (e) {
                    console.log('ActiveX method failed:', e);
                }
                
                // Method 2: Try server-side launch first (most reliable)
                try {
                    showStatus('🔄 Attempting to launch TightVNC via server...', 'info');
                    autoLaunchStatus.textContent = '🔄 Launching TightVNC via server...';
                    autoLaunchStatus.className = 'status info';
                    
                    fetch(\`/launch-vnc?ip=\${ip}&port=\${port}&password=\${password}\`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                showStatus('✅ TightVNC launched via server!', 'success');
                                autoLaunchStatus.textContent = '✅ TightVNC launched successfully!';
                                autoLaunchStatus.className = 'status success';
                            } else {
                                showStatus('❌ Server launch failed: ' + data.error, 'error');
                                autoLaunchStatus.textContent = '❌ Launch failed. Please use manual command.';
                                autoLaunchStatus.className = 'status error';
                                // Fallback to manual command
                                setTimeout(() => {
                                    showManualCommand();
                                }, 2000);
                            }
                        })
                        .catch(error => {
                            console.log('Server launch failed:', error);
                            showStatus('❌ Server launch failed. Trying alternative methods...', 'error');
                            autoLaunchStatus.textContent = '❌ Server launch failed. Trying alternative methods...';
                            autoLaunchStatus.className = 'status error';
                            // Try alternative methods
                            tryAlternativeMethods();
                        });
                    return;
                } catch (e) {
                    console.log('Server-side method failed:', e);
                    tryAlternativeMethods();
                }
                
            } catch (error) {
                console.error('Error launching TightVNC:', error);
                showStatus('❌ Error launching TightVNC: ' + error.message, 'error');
                autoLaunchStatus.textContent = '❌ Error launching TightVNC. Please use manual command.';
                autoLaunchStatus.className = 'status error';
                showManualCommand();
            }
        }
        
        function tryAlternativeMethods() {
            const autoLaunchStatus = document.getElementById('auto-launch-status');
            
            // Method 3: Try protocol handler (less reliable)
            try {
                showStatus('🔄 Trying protocol handler...', 'info');
                autoLaunchStatus.textContent = '🔄 Trying protocol handler...';
                autoLaunchStatus.className = 'status info';
                window.location.href = \`tightvnc://\${ip}:\${port}?password=\${password}\`;
                
                // Fallback after 3 seconds if protocol doesn't work
                setTimeout(() => {
                    showStatus('❌ Protocol launch failed. Please use manual command.', 'error');
                    autoLaunchStatus.textContent = '❌ All automatic methods failed. Please use manual command.';
                    autoLaunchStatus.className = 'status error';
                    showManualCommand();
                }, 3000);
                return;
            } catch (e) {
                console.log('Protocol handler method failed:', e);
                showStatus('❌ All automatic methods failed. Please use manual command.', 'error');
                autoLaunchStatus.textContent = '❌ All automatic methods failed. Please use manual command.';
                autoLaunchStatus.className = 'status error';
                showManualCommand();
            }
        }
        
        function showManualCommand() {
            const manualDiv = document.getElementById('manual-command');
            manualDiv.style.display = 'block';
            
            // Update the command with current parameters
            const commandElement = manualDiv.querySelector('code');
            
            // Try multiple possible paths in the manual command
            const possibleCommands = [
                \`"C:\\\\Program Files\\\\TightVNC\\\\tvnviewer.exe" -host=\${ip} -port=\${port} -password=\${password}\`,
                \`"C:\\\\Program Files (x86)\\\\TightVNC\\\\tvnviewer.exe" -host=\${ip} -port=\${port} -password=\${password}\`,
                \`"C:\\\\TightVNC\\\\tvnviewer.exe" -host=\${ip} -port=\${port} -password=\${password}\`
            ];
            
            commandElement.innerHTML = possibleCommands.map((cmd, index) => 
                \`<div style="margin-bottom: 10px;"><strong>Option \${index + 1}:</strong><br>\${cmd}</div>\`
            ).join('');
            
            // Scroll to manual command
            manualDiv.scrollIntoView({ behavior: 'smooth' });
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
            const autoLaunchStatus = document.getElementById('auto-launch-status');
            const downloadDiv = document.getElementById('download-info');
            downloadDiv.style.display = 'block';
            
            // Scroll to download info
            downloadDiv.scrollIntoView({ behavior: 'smooth' });
            
            showStatus('📥 Opening TightVNC download page...', 'info');
            autoLaunchStatus.textContent = '📥 Opening TightVNC download page...';
            autoLaunchStatus.className = 'status info';
            
            // Open download page in new tab
            window.open('https://www.tightvnc.com/download.php', '_blank');
        }

        function checkInstallation() {
            const installationStatusDiv = document.getElementById('installation-status');
            const statusContent = document.getElementById('status-content');
            installationStatusDiv.style.display = 'block';
            statusContent.innerHTML = '<p>Checking TightVNC installation...</p>';

            // Use server-side check
            fetch('/check-tightvnc')
                .then(response => response.json())
                .then(data => {
                    if (data.installed) {
                        statusContent.innerHTML = \`
                            <p style="color: #155724; font-weight: bold;">✅ TightVNC Viewer is installed!</p>
                            <p><strong>Path:</strong> <code style="background: #d4edda; padding: 5px; border-radius: 3px;">\${data.path}</code></p>
                            <p style="color: #155724;">You can now use the "Launch TightVNC" button.</p>
                        \`;
                    } else {
                        statusContent.innerHTML = \`
                            <p style="color: #721c24; font-weight: bold;">❌ TightVNC Viewer not found on your system.</p>
                            <p><strong>Tried paths:</strong></p>
                            <ul style="color: #721c24; margin-left: 20px;">
                                \${data.triedPaths.map(path => \`<li>❌ \${path}</li>\`).join('')}
                            </ul>
                            <p style="color: #007bff;">Please download and install TightVNC Viewer from 
                                <a href="https://www.tightvnc.com/download.php" target="_blank" style="color: #007bff;">https://www.tightvnc.com/download.php</a> 
                                and restart your browser.
                            </p>
                        \`;
                    }
                })
                .catch(error => {
                    statusContent.innerHTML = \`
                        <p style="color: #721c24; font-weight: bold;">❌ Error checking installation: \${error.message}</p>
                        <p>Please try downloading TightVNC Viewer manually from 
                            <a href="https://www.tightvnc.com/download.php" target="_blank" style="color: #007bff;">https://www.tightvnc.com/download.php</a>
                        </p>
                    \`;
                });
        }
        
        // Auto-launch on page load
        setTimeout(() => {
            console.log('Auto-launching TightVNC...');
            autoLaunchVNC();
        }, 1000);
        
        function autoLaunchVNC() {
            const autoLaunchStatus = document.getElementById('auto-launch-status');
            
            // First check if TightVNC is installed
            fetch('/check-tightvnc')
                .then(response => response.json())
                .then(data => {
                    if (data.installed) {
                        console.log('TightVNC found, launching...');
                        autoLaunchStatus.textContent = '🚀 TightVNC found! Launching automatically...';
                        autoLaunchStatus.className = 'status info';
                        launchTightVNC();
                    } else {
                        console.log('TightVNC not found, showing download info...');
                        autoLaunchStatus.textContent = '❌ TightVNC not found. Opening download page...';
                        autoLaunchStatus.className = 'status error';
                        setTimeout(() => {
                            downloadTightVNC();
                        }, 2000);
                    }
                })
                .catch(error => {
                    console.error('Error checking installation:', error);
                    autoLaunchStatus.textContent = '❌ Error checking installation. Trying manual launch...';
                    autoLaunchStatus.className = 'status error';
                    setTimeout(() => {
                        launchTightVNC();
                    }, 2000);
                });
        }
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
    
    let attempts = 0;
    let maxAttempts = possiblePaths.length;
    
    function tryLaunch(index) {
      if (index >= maxAttempts) {
        // All attempts failed
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'TightVNC not found. Please install TightVNC Viewer first.',
          message: 'Tried paths: ' + possiblePaths.join(', '),
          suggestion: 'Download from: https://www.tightvnc.com/download.php'
        }));
        return;
      }
      
      const path = possiblePaths[index];
      const command = `"${path}" -host=${ip} -port=${port} -password=${password}`;
      
      console.log(`Trying path ${index + 1}/${maxAttempts}: ${path}`);
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error launching TightVNC from ${path}:`, error.message);
          // Try next path
          tryLaunch(index + 1);
        } else {
          console.log(`TightVNC launched successfully from ${path}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: true, 
            message: `TightVNC launched successfully from ${path}`,
            command: command,
            path: path
          }));
        }
      });
    }
    
    // Start trying paths
    tryLaunch(0);
  } else if (req.url === '/check-tightvnc') {
    // Check if TightVNC is installed
    const fs = require('fs');
    const possiblePaths = [
      'C:\\Program Files\\TightVNC\\tvnviewer.exe',
      'C:\\Program Files (x86)\\TightVNC\\tvnviewer.exe',
      'C:\\TightVNC\\tvnviewer.exe',
      'C:\\Program Files\\TightVNC\\tvnviewer64.exe'
    ];
    
    let installed = false;
    let foundPath = '';
    const triedPaths = [];
    
    for (const path of possiblePaths) {
      triedPaths.push(path);
      try {
        if (fs.existsSync(path)) {
          installed = true;
          foundPath = path;
          break;
        }
      } catch (error) {
        console.error(`Error checking path ${path}:`, error.message);
      }
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      installed: installed,
      path: foundPath,
      triedPaths: triedPaths
    }));
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
