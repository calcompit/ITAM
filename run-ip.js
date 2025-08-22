#!/usr/bin/env node

// Dynamic IP runner script
// Usage: 
//   npm run dev:full 100.117.205.41
//   npm run dev:server 10.51.101.49
//   node run-ip.js 100.117.205.41 full

const { spawn } = require('child_process');

// Get IP from npm script or command line
let ip = process.argv[2];
let isFull = process.argv[3] === 'full';

// If no IP provided, try to get from npm script
if (!ip) {
  // Check if this was called from npm script
  const npmScript = process.env.npm_lifecycle_event;
  if (npmScript && npmScript.includes(':')) {
    const parts = npmScript.split(':');
    if (parts.length >= 3) {
      ip = parts[2]; // Get IP from script name
      isFull = parts.includes('full');
    }
  }
}

if (!ip) {
  console.log('Usage:');
  console.log('  npm run dev:full <IP>');
  console.log('  npm run dev:server <IP>');
  console.log('  node run-ip.js <IP> [full]');
  console.log('');
  console.log('Examples:');
  console.log('  npm run dev:full 10.51.101.49');
  console.log('  npm run dev:server 100.117.205.41');
  console.log('  node run-ip.js localhost full');
  process.exit(1);
}

// Determine environment based on IP
const isLocalhost = ip === 'localhost' || ip === '127.0.0.1';
const nodeEnv = isLocalhost ? 'development' : 'production';
const frontendPort = isLocalhost ? '8080' : '8081';

// Set environment variables
const env = {
  ...process.env,
  NODE_ENV: nodeEnv,
  HOST: ip,
  BACKEND_URL: `http://${ip}:3002`,
  FRONTEND_URL: `http://${ip}:${frontendPort}`,
  NOVNC_URL: `http://${ip}:6081`
};

console.log(`🚀 Starting IT Asset Monitor for IP: ${ip}`);
console.log(`📊 Environment: ${nodeEnv}`);
console.log(`🌐 Backend: ${env.BACKEND_URL}`);
console.log(`🎨 Frontend: ${env.FRONTEND_URL}`);
console.log(`🖥️  VNC: ${env.NOVNC_URL}`);

if (isFull) {
  console.log('🔄 Running in full mode (server + frontend)...');
  
  // Run both server and frontend
  const serverProcess = spawn('node', ['server.js'], { 
    env, 
    stdio: 'inherit',
    shell: true 
  });
  
  const frontendProcess = spawn('npx', ['vite'], { 
    env, 
    stdio: 'inherit',
    shell: true 
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    serverProcess.kill();
    frontendProcess.kill();
    process.exit(0);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    frontendProcess.kill();
  });
  
  frontendProcess.on('close', (code) => {
    console.log(`Frontend process exited with code ${code}`);
    serverProcess.kill();
  });
  
} else {
  console.log('🖥️  Running server only...');
  
  // Run server only
  const serverProcess = spawn('node', ['server.js'], { 
    env, 
    stdio: 'inherit',
    shell: true 
  });
  
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    serverProcess.kill();
    process.exit(0);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}
