#!/usr/bin/env node

// Dynamic runner script using environment variables
// Usage: 
//   IP=100.117.205.41 npm run dev:full
//   IP=10.51.101.49 npm run dev:server

const { spawn } = require('child_process');

// Get IP from environment variable
const ip = process.env.IP || process.argv[2];

if (!ip) {
  console.log('Usage:');
  console.log('  IP=100.117.205.41 npm run dev:full');
  console.log('  IP=10.51.101.49 npm run dev:server');
  console.log('  node run-dynamic.js 100.117.205.41 full');
  console.log('');
  console.log('Examples:');
  console.log('  IP=10.51.101.49 npm run dev:full');
  console.log('  IP=100.117.205.41 npm run dev:server');
  console.log('  IP=localhost npm run dev:full');
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

// Check if this is full mode (server + frontend)
const isFull = process.argv.includes('full') || process.env.FULL === 'true';

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
