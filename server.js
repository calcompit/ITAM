import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
const envPath = process.env.NODE_ENV === 'development' ? 'env.mac' : 
                process.env.NODE_ENV === 'production' && process.env.HOST === '10.51.101.49' ? 'env.windows10' :
                process.env.NODE_ENV === 'production' && process.env.HOST === '100.117.205.41' ? 'env.windows100' :
                '.env';
dotenv.config({ path: envPath });

// Helper function to check if computer is online (10 minutes threshold)
function isComputerOnline(updatedAt) {
  const now = new Date();
  const utcDate = new Date(updatedAt);
  const thaiDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000)); // Convert to Thai time
  const diffInMinutes = (now - thaiDate) / (1000 * 60);
  return diffInMinutes <= 10;
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Environment configuration - Use environment variables
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Get HOST from environment variables with fallbacks
const getHost = () => {
  if (process.env.HOST) {
    return process.env.HOST;
  }
  if (isDevelopment) {
    return 'localhost';
  }
  return process.env.PRODUCTION_HOST || 'localhost';
};

const HOST = getHost();
const PORT = process.env.PORT || 3002;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 8080;
const NOVNC_PORT = process.env.NOVNC_PORT || 6081;

// Log environment configuration
console.log(`[CONFIG] Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`[CONFIG] Host: ${HOST}`);
console.log(`[CONFIG] Backend Port: ${PORT}`);
console.log(`[CONFIG] Frontend Port: ${FRONTEND_PORT}`);
console.log(`[CONFIG] noVNC Port: ${NOVNC_PORT}`);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all 10.x.x.x IP addresses (entire 10.0.0.0/8 range)
    if (origin.match(/^https?:\/\/10\.\d+\.\d+\.\d+/)) {
      return callback(null, true);
    }
    
    // Allow all 100.x.x.x IP addresses (entire 100.0.0.0/8 range)
    if (origin.match(/^https?:\/\/100\.\d+\.\d+\.\d+/)) {
      return callback(null, true);
    }
    
    // Allow localhost for development (any port)
    if (origin.match(/^https?:\/\/localhost:\d+/)) {
      return callback(null, true);
    }
    
    // Allow localhost without port for development
    if (origin.match(/^https?:\/\/localhost$/)) {
      return callback(null, true);
    }
    
    // Allow specific localhost ports for development
    if (origin === 'http://localhost:8081' || origin === 'http://localhost:8082') {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(process.cwd(), 'dist')));

// Serve index.html for all non-API routes (SPA routing)
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

// SQL Server configuration - Optimized for internal network
const sqlConfig = {
  user: process.env.DB_USER || 'ccet',
  password: process.env.DB_PASSWORD || '!qaz7410',
  database: process.env.DB_NAME || 'mes',
  server: process.env.DB_SERVER || 'localhost',
  options: {
    encrypt: false, // Disable encryption for internal network performance
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 30000, // 30 seconds
    connectionTimeout: 30000,
    pool: {
      max: 20, // Increased for better performance
      min: 5,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    },
    trustServerCertificate: true,
    connectTimeout: 60000, // เพิ่ม timeout เป็น 60 วินาที
    requestTimeout: 60000, // เพิ่ม timeout เป็น 60 วินาที
    connectionRetryInterval: 1000,
    maxRetriesOnTries: 10, // เพิ่มจำนวน retry
    cancelTimeout: 30000, // เพิ่ม timeout
    packetSize: 4096,
    useUTC: false,
    enableArithAbort: true,
    enableNumericRoundabort: false,
    multipleActiveResultSets: false,
    applicationIntent: 'ReadWrite'
  },
  pool: {
    max: 1, // ใช้ connection เดียว
    min: 0,
    idleTimeoutMillis: 600000, // เพิ่ม idle timeout เป็น 10 นาที
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 60000,
    destroyTimeoutMillis: 10000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100
  }
};

// Log database configuration (without password)
console.log('[DB] Database configuration:');
console.log(`[DB] Server: ${sqlConfig.server}`);
console.log(`[DB] Database: ${sqlConfig.database}`);
console.log(`[DB] User: ${sqlConfig.user}`);

// Database connection pool with retry logic
let pool = null;
let isConnecting = false;
let connectionAttempts = 0;
const maxConnectionAttempts = 20; // เพิ่มจำนวน retry
let connectionStatus = 'disconnected'; // 'connected', 'disconnected', 'connecting', 'failed'

async function createConnectionPool() {
  if (isConnecting) {
    console.log('[DB] Connection already in progress, waiting...');
    // Wait for existing connection to complete
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return pool; // Return the pool that was created by the other connection attempt
  }
  
  isConnecting = true;
  connectionAttempts++;
  connectionStatus = 'connecting';
  
  try {
    console.log(`[DB] Attempting to connect to SQL Server (attempt ${connectionAttempts}/${maxConnectionAttempts})...`);
    pool = await sql.connect(sqlConfig);
    console.log('[DB] Successfully connected to SQL Server');
    setupPoolEvents(pool);
    isConnecting = false;
    connectionAttempts = 0; // Reset counter on success
    connectionStatus = 'connected';
    return pool;
  } catch (error) {
    console.error('[DB] Connection failed:', error.message);
    isConnecting = false;
    connectionStatus = 'failed';
    
    if (connectionAttempts < maxConnectionAttempts) {
      // Exponential backoff: 1, 2, 4, 8, 16, 32 seconds
      const retryDelay = Math.min(1000 * Math.pow(2, connectionAttempts - 1), 60000);
      console.log(`[DB] Retrying connection in ${retryDelay/1000} seconds...`);
      setTimeout(() => {
        createConnectionPool();
      }, retryDelay);
    } else {
      console.log('[DB] Max connection attempts reached, will retry later');
      connectionAttempts = 0; // Reset for next cycle
      connectionStatus = 'disconnected';
    }
    
    throw error;
  }
}

// Handle pool close events
function setupPoolEvents(pool) {
  if (pool) {
    pool.on('close', () => {
      console.log('[DB] Connection pool closed, resetting pool and status');
      pool = null;
      connectionStatus = 'disconnected';
      // Trigger immediate reconnection
      setTimeout(() => {
        console.log('[DB] Triggering reconnection after pool close');
        createConnectionPool();
      }, 1000);
    });
    
    pool.on('error', (error) => {
      console.error('[DB] Connection pool error:', error.message);
      pool = null;
      connectionStatus = 'failed';
      // Trigger immediate reconnection
      setTimeout(() => {
        console.log('[DB] Triggering reconnection after pool error');
        createConnectionPool();
      }, 1000);
    });
  }
}

// Initialize connection pool
createConnectionPool();

// Only reconnect when connection is lost (no keep-alive)
setInterval(async () => {
  if (!pool || pool.closed) {
    console.log('[DB] Auto-reconnect: Connection lost, attempting to reconnect...');
    try {
      await createConnectionPool();
    } catch (error) {
      console.log('[DB] Auto-reconnect failed:', error.message);
    }
  }
}, 30000); // Check every 30 seconds

// Function to get database connection with retry
async function getDbConnection() {
  try {
    if (!pool || pool.closed) {
      console.log('[DB] Pool is null or closed, creating new connection...');
      await createConnectionPool();
    }
    
    // Don't test connection every time, just return the pool
    // Connection will be tested when actually used
    return pool;
  } catch (error) {
    console.error('[DB] Failed to get connection:', error.message);
    return null;
  }
}

// WebSocket clients
const clients = new Set();
const userClients = new Map(); // username -> Set of WebSocket clients

// VNC Session management
const activeSessions = new Map(); // port -> sessionInfo
const authenticatedUsers = new Map(); // username -> userInfo

// Session cleanup interval (every 5 minutes)
setInterval(() => {
  const now = new Date();
  const timeoutMinutes = 30; // 30 minutes timeout
  
  for (const [username, userInfo] of authenticatedUsers.entries()) {
    const lastActivity = new Date(userInfo.lastActivity);
    const diffMinutes = (now - lastActivity) / (1000 * 60);
    
    if (diffMinutes > timeoutMinutes) {
      console.log(`[Session Cleanup] Removing expired session for user: ${username}`);
      authenticatedUsers.delete(username);
      
      // Also cleanup any active sessions for this user
      for (const [port, session] of activeSessions.entries()) {
        if (session.username === username) {
          console.log(`[Session Cleanup] Cleaning up VNC session on port ${port} for user: ${username}`);
          cleanupSession(port);
        }
      }
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Port range configuration
let PORT_RANGE = {
  start: 6081,
  end: 6100 // เริ่มต้นที่ 20 sessions
};

// Broadcast to all connected clients
function broadcast(data) {
  console.log(`[WebSocket] Broadcasting ${data.type} to ${clients.size} clients`);
  let sentCount = 0;
  clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(data));
      sentCount++;
    }
  });
  console.log(`[WebSocket] Successfully sent to ${sentCount} clients`);
}

// Kick user's WebSocket clients
function kickUserClients(username) {
  const userWsSet = userClients.get(username);
  if (userWsSet) {
    console.log(`[WebSocket] Kicking ${userWsSet.size} clients for user: ${username}`);
    userWsSet.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({
          type: 'session_terminated',
          message: 'Your session has been terminated due to login from another location',
          timestamp: new Date().toISOString()
        }));
        client.close(1000, 'Session terminated');
      }
    });
    userClients.delete(username);
  }
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log(`[WebSocket] New client connected. Total clients: ${clients.size + 1}`);
  clients.add(ws);
  
  // Send initial connection confirmation
  ws.send(JSON.stringify({
    type: 'connection_established',
    message: 'Connected to real-time updates',
    timestamp: new Date().toISOString()
  }));
  
  // WebSocket connection established successfully
  
  ws.on('close', () => {
    clients.delete(ws);
    // Remove from userClients if exists
    for (const [username, userWsSet] of userClients.entries()) {
      if (userWsSet.has(ws)) {
        userWsSet.delete(ws);
        if (userWsSet.size === 0) {
          userClients.delete(username);
        }
        break;
      }
    }
    console.log(`[WebSocket] Client disconnected. Total clients: ${clients.size}`);
  });
  
  ws.on('error', (error) => {
    console.error('[WebSocket] Client error:', error.message);
    clients.delete(ws);
  });
  
  // Handle user authentication message
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'authenticate' && data.username) {
        // Add client to user's client set
        if (!userClients.has(data.username)) {
          userClients.set(data.username, new Set());
        }
        userClients.get(data.username).add(ws);
        console.log(`[WebSocket] Client authenticated as: ${data.username}`);
      }
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error);
    }
  });
});

// Function to send alert notification to specific user
function sendAlertNotificationToUser(username, alert) {
  const userWsSet = userClients.get(username);
  if (userWsSet) {
    const notification = {
      type: 'alert_notification',
      alert: alert,
      message: 'New alert received'
    };
    
    userWsSet.forEach(ws => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify(notification));
      }
    });
    
    console.log(`[WebSocket] Sent alert notification to user: ${username}`);
  }
}

// VNC Helper Functions

// 🎯 CRITICAL: Pre-flight validation for 100% accuracy
async function validateVNCPrerequisites(host, port) {
  console.log(`🔍 [VNC VALIDATE] Checking prerequisites for ${host}:${port}...`);
  
  try {
    const { exec } = await import('child_process');
    const util = await import('util');
    const execPromise = util.promisify(exec);
    
    // 1. Check Python
    try {
      const pythonCheck = await execPromise('python --version');
      console.log(`✅ [VNC VALIDATE] Python: ${pythonCheck.stdout.trim()}`);
    } catch (error) {
      throw new Error(`Python not found: ${error.message}`);
    }
    
    // 2. Check websockify module
    try {
      await execPromise('python -c "import websockify; print(\'websockify available\')"');
      console.log(`✅ [VNC VALIDATE] Websockify module available`);
    } catch (error) {
      throw new Error(`Websockify module not found: ${error.message}`);
    }
    
    // 3. Test target connectivity
    console.log(`🎯 [VNC VALIDATE] Testing connectivity to ${host}:${port}...`);
    const net = await import('net');
    const socket = new net.Socket();
    
    const connectTest = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error(`Connection timeout to ${host}:${port} (3 seconds)`));
      }, 3000);
      
      socket.connect(port, host, () => {
        clearTimeout(timeout);
        socket.destroy();
        console.log(`✅ [VNC VALIDATE] Target ${host}:${port} is reachable`);
        resolve(true);
      });
      
      socket.on('error', (err) => {
        clearTimeout(timeout);
        socket.destroy();
        reject(new Error(`Cannot connect to ${host}:${port}: ${err.message}`));
      });
    });
    
    await connectTest;
    console.log(`🎉 [VNC VALIDATE] All prerequisites passed for ${host}:${port}`);
    return true;
    
  } catch (error) {
    console.error(`❌ [VNC VALIDATE] Failed for ${host}:${port}:`, error.message);
    throw error;
  }
}

function findAvailablePort() {
  console.log(`[VNC] Finding available port. Current active sessions:`, Array.from(activeSessions.keys()));
  console.log(`[VNC] Port range: ${PORT_RANGE.start}-${PORT_RANGE.end}`);
  
  // Try to find a random available port to avoid always using 6081
  const usedPorts = Array.from(activeSessions.keys());
  console.log(`[VNC] Used ports:`, usedPorts);
  
  // Start from a random port in the middle of the range to avoid 6081
  const startPort = PORT_RANGE.start + Math.floor(Math.random() * 5); // Start from 6081-6085 randomly
  
  for (let i = 0; i < PORT_RANGE.end - PORT_RANGE.start + 1; i++) {
    const port = startPort + i;
    if (port > PORT_RANGE.end) {
      // Wrap around to the beginning
      const wrappedPort = PORT_RANGE.start + (port - PORT_RANGE.end - 1);
      console.log(`[VNC] Checking wrapped port ${wrappedPort}: ${activeSessions.has(wrappedPort) ? 'IN USE' : 'AVAILABLE'}`);
      if (!activeSessions.has(wrappedPort)) {
        console.log(`[VNC] Found available wrapped port: ${wrappedPort}`);
        return wrappedPort;
      }
    } else {
      console.log(`[VNC] Checking port ${port}: ${activeSessions.has(port) ? 'IN USE' : 'AVAILABLE'}`);
      if (!activeSessions.has(port)) {
        console.log(`[VNC] Found available port: ${port}`);
        return port;
      }
    }
  }
  console.log(`[VNC] No available ports in range ${PORT_RANGE.start}-${PORT_RANGE.end}`);
  return null;
}

async function killWebsockify(port) {
  try {
    const { exec } = await import('child_process');
    return new Promise((resolve) => {
      const command = process.platform === 'win32' 
        ? `taskkill /f /im python.exe /fi "WINDOWTITLE eq websockify*${port}*" 2>nul`
        : `pkill -f "websockify.*${port}"`;
      
      exec(command, (error) => {
        if (error) {
          console.log(`No websockify process found on port ${port}`);
        } else {
          console.log(`Killed websockify process on port ${port}`);
        }
        resolve();
      });
    });
  } catch (error) {
    console.error('Error killing websockify:', error);
  }
}

async function cleanupSession(port) {
  console.log(`[VNC Cleanup] Cleaning up session on port ${port}`);
  const session = activeSessions.get(port);
  
  if (session && session.process) {
    console.log(`[VNC Cleanup] Killing process for session on port ${port}`);
    try {
      session.process.kill('SIGTERM');
      
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Force kill if still alive
      if (!session.process.killed) {
        console.log(`[VNC Cleanup] Force killing process on port ${port}`);
        session.process.kill('SIGKILL');
      }
    } catch (error) {
      console.log(`[VNC Cleanup] Error killing process: ${error.message}`);
    }
  }
  
  // Kill websockify process on this port
  try {
    await killWebsockify(port);
  } catch (error) {
    console.log(`[VNC Cleanup] Error killing websockify: ${error.message}`);
  }
  
  // Remove from active sessions
  activeSessions.delete(port);
  console.log(`[VNC Cleanup] Removed session from activeSessions. Remaining sessions:`, Array.from(activeSessions.keys()));
}

// Test database connection (legacy function - now handled by createConnectionPool)
async function testConnection() {
  try {
    const pool = await getDbConnection();
    
    // Setup realtime monitoring
    await setupRealtimeMonitoring(pool);
  } catch (err) {
    console.log('Database connection failed, using fallback data');
    // Fallback to polling when database is unavailable
    startPollingMonitoring();
  }
}

// Setup realtime monitoring using Service Broker
async function setupRealtimeMonitoring(pool) {
  try {
    console.log('Setting up real-time monitoring...');
    
    // Since Service Broker is disabled to prevent C# errors, use polling monitoring
    console.log('Service Broker disabled, using polling monitoring for real-time updates...');
    startPollingMonitoring();
    
  } catch (err) {
    console.error('Real-time monitoring setup failed:', err.message);
    console.log('Falling back to polling monitoring...');
    startPollingMonitoring();
  }
}

// Create Service Broker objects (disabled to prevent C# errors)
async function createServiceBrokerObjects(pool) {
  try {
    console.log('[Service Broker] Skipping Service Broker setup to prevent C# errors');
    // Service Broker setup disabled to prevent C# application errors
    // If you need real-time updates, implement them at application level
    
  } catch (err) {
    console.log('[Service Broker] Error (ignored):', err.message);
  }
}

// Start monitoring for changes using Service Broker (disabled to prevent C# errors)
async function startChangeMonitoring(pool) {
  try {
    console.log('[Service Broker] Skipping trigger creation to prevent C# errors');
    // Trigger creation disabled to prevent C# application errors
    // If you need real-time updates, implement them at application level
    
    // Start listening for messages (disabled)
    // startMessageListener(pool);
    
  } catch (err) {
    console.log('[Service Broker] Error (ignored):', err.message);
  }
}

// Listen for Service Broker messages
async function startMessageListener(pool) {
  const listenForMessages = async () => {
    try {
      const result = await pool.request().query(`
        WAITFOR (
          RECEIVE TOP(1)
            message_type_name,
            message_body,
            conversation_handle
          FROM [ITAssetChangeQueue]
        ), TIMEOUT 5000;
      `);
      
      if (result.recordset.length > 0) {
        const message = result.recordset[0];
        
        if (message.message_type_name === 'ITAssetChangeMessage') {
          const changeData = JSON.parse(message.message_body.toString());
          
          // Get full updated data for the changed record
          if (changeData.MachineID) {
            const fullDataResult = await pool.request()
              .input('machineID', sql.VarChar, changeData.MachineID)
              .query(`
                SELECT * FROM [mes].[dbo].[TBL_IT_MachinesCurrent]
                WHERE MachineID = @machineID
              `);
            
            if (fullDataResult.recordset.length > 0) {
              const row = fullDataResult.recordset[0];
              const updatedComputer = {
                machineID: row.MachineID,
                computerName: row.ComputerName,
                ipAddresses: row.IPv4 ? row.IPv4.split(',').map(ip => ip.trim()) : [],
                domain: row.Domain || '',
                sUser: row.SUser || '',
                status: (() => {
                  const updatedAt = new Date(row.UpdatedAt);
                  const now = new Date();
                  const diffInMinutes = (now - updatedAt) / (1000 * 60);
                  return diffInMinutes <= 10 ? 'online' : 'offline';
                })(),
                cpu: row.CPU_Json ? JSON.parse(row.CPU_Json) : { model: '', cores: 0, speed: 0 },
                ram: row.RAM_ModulesJson ? JSON.parse(row.RAM_ModulesJson) : { totalGB: 0, modules: [] },
                storage: row.Storage_Json ? JSON.parse(row.Storage_Json) : { totalGB: 0, drives: [] },
                gpu: row.GPU_Json ? JSON.parse(row.GPU_Json) : { model: '', memory: 0 },
                network: row.NIC_Json ? JSON.parse(row.NIC_Json) : { adapters: [] },
                lastBoot: row.LastBoot,
                updatedAt: row.UpdatedAt,
                winActivated: row.Win_Activated === 1,
                isPinned: false // Will be preserved by frontend
              };
              
              // Broadcast change to all connected clients
              broadcast({
                type: 'data_update',
                data: {
                  changeType: changeData.changeType,
                  updatedComputers: [updatedComputer],
                  timestamp: new Date().toISOString()
                }
              });
            }
          }
          
          // End the conversation
          await pool.request()
            .input('handle', sql.UniqueIdentifier, message.conversation_handle)
            .query('END CONVERSATION @handle');
        }
      }
    } catch (err) {
      // Silent error handling
    }
    
    // Continue listening
    setTimeout(listenForMessages, 1000);
  };
  
  listenForMessages();
}

// Start listening for Service Broker messages
function startListeningForMessages(pool) {
  const listenForMessages = async () => {
    try {
      const result = await pool.request().query(`
        WAITFOR (
          RECEIVE TOP(1)
            message_type_name,
            message_body,
            conversation_handle
          FROM [ITAssetChangeQueue]
        ), TIMEOUT 5000
      `);
      
      if (result.recordset.length > 0) {
        const message = result.recordset[0];
        
        if (message.message_type_name === 'ITAssetChangeMessage') {
          try {
            const changeData = JSON.parse(message.message_body.toString());
            console.log('[Service Broker] Received change:', changeData);
            
            // Broadcast to WebSocket clients
            broadcast({
              type: 'data_update',
              data: {
                changeType: changeData.changeType,
                machineID: changeData.MachineID,
                computerName: changeData.ComputerName,
                timestamp: changeData.timestamp
              }
            });
          } catch (parseError) {
            console.error('[Service Broker] Error parsing message:', parseError);
          }
        }
        
        // End the conversation
        await pool.request()
          .input('handle', sql.UniqueIdentifier, message.conversation_handle)
          .query('END CONVERSATION @handle');
      }
    } catch (err) {
      console.error('[Service Broker] Error listening for messages:', err.message);
    }
    
    // Continue listening
    setTimeout(listenForMessages, 1000);
  };
  
  listenForMessages();
}

// Fallback: Polling-based monitoring
function startPollingMonitoring() {
  let lastCheck = new Date();
  console.log('[Real-time] Starting polling monitoring with initial check time:', lastCheck.toISOString());
  
  const pollForChanges = async () => {
    try {
      const pool = await getDbConnection();
      if (!pool || pool.closed) {
        console.log('[Real-time] Database pool is closed, skipping polling...');
        // Continue polling even if database is down
        setTimeout(pollForChanges, 5000);
        return;
      }
      
      const result = await pool.request()
        .input('lastCheck', sql.DateTime, lastCheck)
        .query(`
          SELECT 
            MachineID,
            ComputerName,
            UpdatedAt,
            COUNT(*) as changeCount
          FROM [mes].[dbo].[TBL_IT_MachinesCurrent]
          WHERE UpdatedAt > @lastCheck
          GROUP BY MachineID, ComputerName, UpdatedAt
        `);
      
      if (result.recordset.length > 0) {
        console.log(`[Real-time] Found ${result.recordset.length} changes, broadcasting to ${clients.size} clients`);
        console.log('[Real-time] Changed records:', result.recordset.map(r => ({ MachineID: r.MachineID, ComputerName: r.ComputerName, UpdatedAt: r.UpdatedAt })));
        
        // Get full updated data for changed records
        const machineIDs = result.recordset.map(r => `'${r.MachineID}'`).join(',');
        const fullDataResult = await pool.request().query(`
          SELECT * FROM [mes].[dbo].[TBL_IT_MachinesCurrent]
          WHERE MachineID IN (${machineIDs})
        `);
        
        // Process the data similar to main API
        const updatedComputers = fullDataResult.recordset.map(row => ({
          machineID: row.MachineID,
          computerName: row.ComputerName,
          ipAddresses: row.IPv4 ? row.IPv4.split(',').map(ip => ip.trim()) : [],
          domain: row.Domain || '',
          sUser: row.SUser || '',
          status: (() => {
            const updatedAt = new Date(row.UpdatedAt);
            const now = new Date();
            const diffInMinutes = (now - updatedAt) / (1000 * 60);
            return diffInMinutes <= 10 ? 'online' : 'offline';
          })(),
          cpu: row.CPU_Json ? JSON.parse(row.CPU_Json) : { model: '', cores: 0, speed: 0 },
          ram: row.RAM_ModulesJson ? JSON.parse(row.RAM_ModulesJson) : { totalGB: 0, modules: [] },
          storage: row.Storage_Json ? JSON.parse(row.Storage_Json) : { totalGB: 0, drives: [] },
          gpu: row.GPU_Json ? JSON.parse(row.GPU_Json) : { model: '', memory: 0 },
          network: row.NIC_Json ? JSON.parse(row.NIC_Json) : { adapters: [] },
          lastBoot: row.LastBoot,
          updatedAt: row.UpdatedAt,
          winActivated: row.Win_Activated === 1,
          isPinned: false // Will be preserved by frontend
        }));
        
        broadcast({
          type: 'data_update',
          data: {
            changeType: 'UPDATE',
            updatedComputers: updatedComputers,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Update lastCheck only if no changes detected, or use the latest UpdatedAt
      if (result.recordset.length === 0) {
        lastCheck = new Date();
        // Reduce logging frequency for no changes
        if (Math.random() < 0.1) { // Only log 10% of the time
          console.log('[Real-time] No changes detected, updated lastCheck to:', lastCheck.toISOString());
        }
      } else {
        // Use the latest UpdatedAt from the changes
        const latestUpdate = Math.max(...result.recordset.map(r => new Date(r.UpdatedAt).getTime()));
        lastCheck = new Date(latestUpdate);
        console.log('[Real-time] Changes detected, updated lastCheck to:', lastCheck.toISOString());
      }
      // Don't close the pool, keep it for reuse
      
    } catch (err) {
      console.error('[Real-time] Database polling error:', err.message);
      // If connection is closed, try to reconnect
      if (err.message.includes('Connection is closed') || err.message.includes('Connection lost')) {
        console.log('[Real-time] Connection lost, attempting to reconnect...');
        try {
          await createConnectionPool();
        } catch (reconnectError) {
          console.log('[Real-time] Reconnection failed, will continue polling');
        }
      }
      // Continue polling even if there's an error
    }
    
    // Poll every 1 second for faster updates
    setTimeout(pollForChanges, 1000);
  };
  
  console.log('[Real-time] Starting polling monitoring...');
  pollForChanges();
}

// Get all computers from TBL_IT_MachinesCurrent with caching
app.get('/api/computers', async (req, res) => {
  try {
    // Check cache first
    if (isCacheValid('computers')) {
      console.log('[CACHE] Returning cached computers data');
      return res.json(getCache('computers'));
    }
    
    const pool = await getDbConnection();
    
    if (!pool) {
      console.log('[DB] Database not available, using fallback data for computers');
      // Import fallback data
      const { fallbackComputers } = await import('./src/data/fallback-data.js');
      return res.json(fallbackComputers);
    }
    
    console.log('[DB] Fetching computers data from database...');
    const startTime = Date.now();
    
    // Use the correct column names based on the actual database schema
    const result = await pool.request()
      .query(`
        SELECT 
          MachineID,
          ComputerName,
          Domain,
          UUID,
          SUser,
          BoardSerial,
          BiosSerial,
          CPU_Model,
          CPU_PhysicalCores,
          CPU_LogicalCores,
          RAM_TotalGB,
          RAM_ModulesJson,
          Storage_TotalGB,
          Storage_Json,
          GPU_Json,
          NICs_Json,
          OS_Caption,
          OS_Version,
          OS_InstallDate,
          LastBoot,
          IPv4,
          UpdatedAt,
          HUD_Mode,
          HUD_ColorARGB,
          HUD_Version,
          Win_Activated
        FROM [mes].[dbo].[TBL_IT_MachinesCurrent]
        ORDER BY ComputerName
      `);
    
    const queryTime = Date.now() - startTime;
    console.log(`[DB] Query completed in ${queryTime}ms`);

    const computers = result.recordset.map(row => {
      // Parse JSON fields safely with error handling
      const parseJsonSafely = (jsonString) => {
        if (!jsonString) return [];
        try {
          // Clean the JSON string by removing control characters
          const cleanedJson = jsonString.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
          return JSON.parse(cleanedJson);
        } catch (error) {
          console.error('JSON parsing error:', error.message, 'for JSON:', jsonString?.substring(0, 100));
          return [];
        }
      };
      
      const ramModules = parseJsonSafely(row.RAM_ModulesJson);
      const storageDevices = parseJsonSafely(row.Storage_Json);
      const gpuList = parseJsonSafely(row.GPU_Json);
      const nicList = parseJsonSafely(row.NICs_Json);
      
      return {
        machineID: row.MachineID,
        computerName: row.ComputerName,
        domain: row.Domain,
        uuid: row.UUID,
        sUser: row.SUser,
        boardSerial: row.BoardSerial,
        biosSerial: row.BiosSerial,
        cpu: {
          model: row.CPU_Model,
          physicalCores: row.CPU_PhysicalCores,
          logicalCores: row.CPU_LogicalCores
        },
        ram: {
          totalGB: row.RAM_TotalGB,
          modules: ramModules
        },
        storage: {
          totalGB: row.Storage_TotalGB,
          devices: storageDevices
        },
        gpu: gpuList,
        nics: nicList,
        os: {
          caption: row.OS_Caption,
          version: row.OS_Version,
          installDate: row.OS_InstallDate
        },
        lastBoot: row.LastBoot,
        ipAddresses: row.IPv4 ? row.IPv4.split(/[,;]/).map(ip => ip.trim()).filter(ip => ip) : [],
        updatedAt: (() => {
          // Convert UTC time to Thailand time (UTC+7)
          const utcDate = new Date(row.UpdatedAt);
          const thaiDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
          return thaiDate.toISOString();
        })(),
        hudMode: row.HUD_Mode,
        hudColorARGB: row.HUD_ColorARGB,
        hudVersion: row.HUD_Version,
        winActivated: row.Win_Activated === 1 || row.Win_Activated === true,
        status: (() => {
          // Check if the computer is online based on UpdatedAt (10 minutes threshold)
          // Convert to Thai time for comparison
          const now = new Date();
          const utcDate = new Date(row.UpdatedAt);
          const thaiDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
          const diffInMinutes = (now - thaiDate) / (1000 * 60);
          return diffInMinutes <= 10 ? 'online' : 'offline';
        })(),
        isPinned: false
      };
    });
    
    // Cache the processed data
    setCache('computers', computers);
    console.log(`[CACHE] Cached ${computers.length} computers for 30 seconds`);
    
    // Don't close the pool, keep it for reuse
    res.json(computers);
    
  } catch (err) {
    console.error('Error fetching computers:', err.message);
    
    // Return fallback data when database is unavailable
    console.log('[DB] Database error, using fallback data for computers');
    try {
      const { fallbackComputers } = await import('./src/data/fallback-data.js');
      res.json(fallbackComputers);
    } catch (fallbackError) {
      console.error('Fallback data error:', fallbackError.message);
      res.status(503).json({ 
        error: 'Database error',
        message: err.message
      });
    }
  }
});

// Get computer changelog from TBL_IT_MachineChangeLog
app.get('/api/computers/:machineID/changelog', async (req, res) => {
  try {
    const { machineID } = req.params;
    const pool = await getDbConnection();
    
    // Get current computer data
    const currentDataResult = await pool.request()
      .input('machineID', sql.VarChar, machineID)
      .query(`
        SELECT TOP 1 *
        FROM mes.dbo.TBL_IT_MachinesCurrent
        WHERE MachineID = @machineID
        ORDER BY UpdatedAt DESC
      `);
    
    const currentData = currentDataResult.recordset[0];
    
    // Get changelog data
    const changelogResult = await pool.request()
      .input('machineID', sql.VarChar, machineID)
      .query(`
        SELECT TOP 10
          ChangeID,
          MachineID,
          ChangeDate,
          ChangedSUser,
          SnapshotJson_Old,
          SnapshotJson_New
        FROM mes.dbo.TBL_IT_MachineChangeLog
        WHERE MachineID = @machineID
        ORDER BY ChangeDate DESC, ChangeID DESC
      `);
    
    // Process changelog and compare with current data
    const changelog = changelogResult.recordset.map(row => {
      let oldData = {};
      let newData = {};
      
      try {
        if (row.SnapshotJson_Old && row.SnapshotJson_Old !== '{}') {
          oldData = JSON.parse(row.SnapshotJson_Old);
        }
        if (row.SnapshotJson_New && row.SnapshotJson_New !== '{}') {
          newData = JSON.parse(row.SnapshotJson_New);
        }
      } catch (e) {
        console.error('Error parsing JSON:', e);
      }
      
      // Compare old vs new data
      const changes = [];
      const allFields = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
      
      allFields.forEach(field => {
        const oldValue = oldData[field];
        const newValue = newData[field];
        
        // Skip certain fields that change frequently
        if (['LastBoot', 'UpdatedAt', 'HUD_Mode', 'HUD_ColorARGB'].includes(field)) {
          return;
        }
        
        // Check if values are different
        if (oldValue !== newValue) {
          changes.push({
            field: field,
            old: oldValue || 'ไม่มีค่า',
            new: newValue || 'ไม่มีค่า'
          });
        }
      });
      
      // Determine event type
      let eventType = 'UPDATE';
      if (!oldData || Object.keys(oldData).length === 0) {
        eventType = 'INSERT';
      } else if (!newData || Object.keys(newData).length === 0) {
        eventType = 'DELETE';
      }
      
      return {
        changeID: row.ChangeID,
        changeDate: row.ChangeDate,
        changedSUser: row.ChangedSUser || 'System',
        eventType: eventType,
        changedCount: changes.length,
        changedFields: changes.map(c => c.field).join(', '),
        changedDetails: changes
      };
    });
    
    // Add current state comparison if there are changes
    if (currentData && changelog.length > 0) {
      const latestChange = changelog[0];
      const latestNewData = latestChange.changedDetails.find(d => d.field === 'NICs_Json')?.new;
      
      if (latestNewData && currentData.NICs_Json !== latestNewData) {
        // Add a "current state" entry
        changelog.unshift({
          changeID: 'current',
          changeDate: new Date().toISOString(),
          changedSUser: 'System',
          eventType: 'CURRENT',
          changedCount: 1,
          changedFields: 'NICs_Json',
          changedDetails: [{
            field: 'NICs_Json',
            old: latestNewData,
            new: currentData.NICs_Json
          }]
        });
      }
    }
    
    res.json(changelog);
  } catch (err) {
    console.error('Error fetching changelog:', err.message);
    res.json([]); // Return empty array instead of error
  }
});

// Get IP groups summary
app.get('/api/ip-groups', async (req, res) => {
  try {
    // Check cache first
    if (isCacheValid('ip_groups')) {
      console.log('[CACHE] Returning cached IP groups data');
      return res.json(getCache('ip_groups'));
    }
    
    const pool = await getDbConnection();
    
    if (!pool) {
      console.log('[DB] Database not available, using fallback data for IP groups');
      // Import fallback data
      const { fallbackIPGroups } = await import('./src/data/fallback-data.js');
      return res.json(fallbackIPGroups);
    }
    
    console.log('[DB] Fetching IP groups data from database...');
    const startTime = Date.now();
    
    // OPTIMIZED: Simplified query with better performance
    const result = await pool.request()
      .query(`
        SELECT 
          LEFT(IPv4, CHARINDEX('.', IPv4, CHARINDEX('.', IPv4, CHARINDEX('.', IPv4) + 1) + 1) - 1) + '.x' as subnet,
          COUNT(*) as totalComputers,
          SUM(CASE WHEN DATEDIFF(MINUTE, UpdatedAt, GETUTCDATE()) <= 10 THEN 1 ELSE 0 END) as onlineCount,
          SUM(CASE WHEN DATEDIFF(MINUTE, UpdatedAt, GETUTCDATE()) > 10 THEN 1 ELSE 0 END) as offlineCount,
          0 as alertCount
        FROM [mes].[dbo].[TBL_IT_MachinesCurrent] WITH (NOLOCK)
        WHERE IPv4 IS NOT NULL AND IPv4 != '' AND IPv4 LIKE '%.%.%.%'
        GROUP BY LEFT(IPv4, CHARINDEX('.', IPv4, CHARINDEX('.', IPv4, CHARINDEX('.', IPv4) + 1) + 1) - 1)
        ORDER BY subnet
      `);

    const queryTime = Date.now() - startTime;
    console.log(`[DB] IP groups query completed in ${queryTime}ms`);
    
    // Cache the result for 30 seconds
    setCache('ip_groups', result.recordset);
    console.log(`[CACHE] Cached IP groups data for 30 seconds`);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching IP groups:', err.message);
    console.log('[DB] Database error, returning empty data for IP groups');
    return res.json([]);
  }
});



// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const pool = await getDbConnection();
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .input('password', sql.VarChar, password)
      .query(`
        SELECT TOP (1000) [username], [password]
        FROM [mes].[dbo].[TBL_IT_MAINTAINUSER]
        WHERE [username] = @username AND [password] = @password
      `);

    if (result.recordset.length > 0) {
      res.json({ 
        success: true, 
        message: 'Login successful',
        user: {
          username: result.recordset[0].username
        }
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed - please try again' });
  }
});

// Get analytics data
app.get('/api/analytics', async (req, res) => {
  try {
    const pool = await getDbConnection();
    
    if (!pool) {
      console.log('[DB] Database not available, returning error for analytics');
      return res.status(503).json({ 
        error: 'Database connection unavailable',
        message: 'Unable to connect to database server'
      });
    }
    const result = await pool.request()
      .query(`
        SELECT 
          CPU_Model,
          RAM_TotalGB,
          Storage_TotalGB,
          Win_Activated,
          UpdatedAt
        FROM [mes].[dbo].[TBL_IT_MachinesCurrent]
      `);

    const analytics = {
      totalComputers: result.recordset.length,
      cpuTypes: {},
      ramDistribution: {},
      storageDistribution: {},
      activatedCount: 0,
      notActivatedCount: 0,
      onlineCount: 0,
      offlineCount: 0
    };

    result.recordset.forEach(row => {
      // CPU Types
      const cpuModel = row.CPU_Model?.toLowerCase() || '';
      let cpuType = 'other';
      if (cpuModel.includes('pentium')) cpuType = 'pentium';
      else if (cpuModel.includes('i3')) cpuType = 'i3';
      else if (cpuModel.includes('i5')) cpuType = 'i5';
      else if (cpuModel.includes('i7')) cpuType = 'i7';
      else if (cpuModel.includes('xeon')) cpuType = 'xeon';
      
      analytics.cpuTypes[cpuType] = (analytics.cpuTypes[cpuType] || 0) + 1;

      // RAM Distribution
      const ram = parseInt(row.RAM_TotalGB) || 0;
      if (ram <= 8) analytics.ramDistribution["4-8GB"] = (analytics.ramDistribution["4-8GB"] || 0) + 1;
      else if (ram <= 16) analytics.ramDistribution["8-16GB"] = (analytics.ramDistribution["8-16GB"] || 0) + 1;
      else if (ram <= 32) analytics.ramDistribution["16-32GB"] = (analytics.ramDistribution["16-32GB"] || 0) + 1;
      else analytics.ramDistribution["32GB+"] = (analytics.ramDistribution["32GB+"] || 0) + 1;

      // Storage Distribution
      const storage = parseInt(row.Storage_TotalGB) || 0;
      if (storage <= 250) analytics.storageDistribution["0-250GB"] = (analytics.storageDistribution["0-250GB"] || 0) + 1;
      else if (storage <= 500) analytics.storageDistribution["250-500GB"] = (analytics.storageDistribution["250-500GB"] || 0) + 1;
      else if (storage <= 1000) analytics.storageDistribution["500GB-1TB"] = (analytics.storageDistribution["500GB-1TB"] || 0) + 1;
      else analytics.storageDistribution["1TB+"] = (analytics.storageDistribution["1TB+"] || 0) + 1;

      // Windows Activation
      if (row.Win_Activated === 1 || row.Win_Activated === true) {
        analytics.activatedCount++;
      } else if (row.Win_Activated === 0 || row.Win_Activated === null || row.Win_Activated === false) {
        analytics.notActivatedCount++;
      }

      // Online/Offline status based on UpdatedAt
      // Convert to Thai time for comparison
      const utcDate = new Date(row.UpdatedAt);
      const thaiDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
      const now = new Date();
      const diffInMinutes = (now - thaiDate) / (1000 * 60);
      // Use 10 minutes threshold
      if (diffInMinutes <= 10) {
        analytics.onlineCount++;
      } else {
        analytics.offlineCount++;
      }
    });

    res.json(analytics);
  } catch (err) {
    console.error('Error fetching analytics:', err.message);
    console.log('[DB] Database error, returning empty data for analytics');
    return res.json({
      totalComputers: 0,
      cpuTypes: {},
      ramDistribution: {},
      storageDistribution: {},
      activatedCount: 0,
      notActivatedCount: 0,
      onlineCount: 0,
      offlineCount: 0
    });
  }
});

// Alerts count endpoint - Get unread alerts count for specific user
app.get('/api/alerts/:username/count', async (req, res) => {
  try {
    const { username } = req.params;
    const pool = await getDbConnection();
    
    // Get unread alerts count - count only unread alerts
    console.log(`[DEBUG] Fetching unread alerts count for user: ${username}`);
    
    // First get all alerts for the user
    const alertsResult = await pool.request()
      .input('username', sql.VarChar, username)
      .query(`
        SELECT c.ChangeID
        FROM [mes].[dbo].[TBL_IT_MachineChangeLog] c
        LEFT JOIN [mes].[dbo].[TBL_IT_MachinesCurrent] mc ON mc.MachineID = c.MachineID
        WHERE c.SnapshotJson_Old IS NOT NULL 
          AND c.SnapshotJson_Old != '{}' 
          AND c.SnapshotJson_Old != ''
          AND (c.ChangedSUser = @username OR @username = 'c270188')
      `);
    
    // Get read status for this user
    const readStatusResult = await pool.request()
      .input('username', sql.NVarChar, username)
      .query(`
        SELECT AlertID FROM TBL_IT_AlertReadStatus 
        WHERE UserID = @username
      `);
    
    const readAlertIds = new Set(readStatusResult.recordset.map(r => r.AlertID));
    
    // Count unread alerts
    const unreadCount = alertsResult.recordset.filter(row => 
      !readAlertIds.has(row.ChangeID.toString())
    ).length;
    console.log(`[DEBUG] Unread alerts count for ${username}: ${unreadCount}`);
    
    res.json({ unreadCount });
  } catch (err) {
    console.error('Error fetching unread alerts count:', err.message);
    res.status(500).json({ error: 'Failed to fetch unread alerts count' });
  }
});

// Alerts endpoint - Get alerts for specific user with caching
app.get('/api/alerts/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Check cache first
    const cacheKey = `alerts_${username}`;
    if (isCacheValid(cacheKey)) {
      console.log(`[CACHE] Returning cached alerts data for ${username}`);
      return res.json(getCache(cacheKey));
    }
    
    const pool = await getDbConnection();
    
    // Get recent changelog entries and convert to alerts
    console.log(`[DEBUG] Fetching alerts for user: ${username}`);
    console.log(`[DEBUG] Request URL: ${req.url}`);
    console.log(`[DEBUG] Query params:`, req.query);
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query(`
        SELECT TOP 100
          c.ChangeID as id,
          c.MachineID,
          c.ChangeDate as timestamp,
          c.ChangedSUser as username,
          c.SnapshotJson_Old,
          c.SnapshotJson_New,
          mc.ComputerName
        FROM [mes].[dbo].[TBL_IT_MachineChangeLog] c
        LEFT JOIN [mes].[dbo].[TBL_IT_MachinesCurrent] mc ON mc.MachineID = c.MachineID
        WHERE c.SnapshotJson_Old IS NOT NULL 
          AND c.SnapshotJson_Old != '{}' 
          AND c.SnapshotJson_Old != ''
          AND (c.ChangedSUser = @username OR @username = 'c270188')
        ORDER BY c.ChangeDate DESC, c.ChangeID DESC
      `);
    
    console.log(`[DEBUG] Found ${result.recordset.length} changelog records`);
    console.log(`[DEBUG] First record:`, result.recordset[0] ? {
      id: result.recordset[0].id,
      machineID: result.recordset[0].MachineID,
      computerName: result.recordset[0].ComputerName
    } : 'No records');
    
    // Get read status for this user
    const readStatusResult = await pool.request()
      .input('username', sql.NVarChar, username)
      .query(`
        SELECT AlertID FROM TBL_IT_AlertReadStatus 
        WHERE UserID = @username
      `);
    
    const readAlertIds = new Set(readStatusResult.recordset.map(r => r.AlertID));
    
    // Convert to alert format
    const alerts = result.recordset.map(row => {
      let oldData = {};
      let newData = {};
      
      try {
        if (row.SnapshotJson_Old && row.SnapshotJson_Old !== '{}') {
          oldData = JSON.parse(row.SnapshotJson_Old);
        }
        if (row.SnapshotJson_New && row.SnapshotJson_New !== '{}') {
          newData = JSON.parse(row.SnapshotJson_New);
        }
      } catch (e) {
        console.error('Error parsing JSON:', e);
      }
      
      // Compare old vs new data to find changes
      const changes = [];
      const allFields = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
      
      allFields.forEach(field => {
        const oldValue = oldData[field];
        const newValue = newData[field];
        
        // Skip certain fields that change frequently
        if (['LastBoot', 'UpdatedAt', 'HUD_Mode', 'HUD_ColorARGB'].includes(field)) {
          return;
        }
        
        // Check if values are different
        if (oldValue !== newValue) {
          changes.push({
            field: field,
            old: oldValue || 'ไม่มีค่า',
            new: newValue || 'ไม่มีค่า'
          });
        }
      });
      
      // Determine event type
      let eventType = 'UPDATE';
      if (!oldData || Object.keys(oldData).length === 0) {
        eventType = 'INSERT';
      } else if (!newData || Object.keys(newData).length === 0) {
        eventType = 'DELETE';
      }
      
      // Get all changes for alert details
      const allChanges = changes;
      const firstChange = changes[0];
      
      // Determine alert type and severity based on field changes
      let type = 'system';
      let severity = 'medium';
      
      if (firstChange?.field) {
        if (firstChange.field.includes('RAM') || firstChange.field.includes('Storage') || firstChange.field.includes('CPU')) {
          type = 'hardware';
          severity = 'medium';
        } else if (firstChange.field.includes('IP') || firstChange.field.includes('Network') || firstChange.field.includes('NICs')) {
          type = 'network';
          severity = 'low';
        } else if (firstChange.field.includes('Win_Activated')) {
          type = 'security';
          severity = 'high';
        } else if (firstChange.field.includes('User') || firstChange.field.includes('SUser')) {
          type = 'security';
          severity = 'medium';
        }
      }
      
      // Check if this is an old alert (more than 24 hours)
      const alertDate = new Date(row.timestamp);
      const now = new Date();
      const hoursDiff = (now - alertDate) / (1000 * 60 * 60);
      const isOldAlert = hoursDiff > 24;
      
      return {
        id: row.id.toString(),
        machineID: row.MachineID, // Add actual MachineID
        type,
        severity,
        title: firstChange ? `${firstChange.field} Changed` : `${eventType} Event`,
        description: isOldAlert 
          ? `📖 ${eventType} event on ${row.ComputerName || 'Unknown Computer'} - ${changes.length} field(s) changed`
          : `${eventType} event on ${row.ComputerName || 'Unknown Computer'} - ${changes.length} field(s) changed`,
        computerName: row.ComputerName || 'Unknown Computer',
        timestamp: row.timestamp,
        username: row.username,
        isRead: readAlertIds.has(row.id.toString()), // Check if user has read this alert
        isOldAlert, // Flag to indicate this is an old alert
        changeDetails: allChanges.length > 0 ? {
          fields: allChanges.map(change => change.field),
          changes: allChanges.map(change => ({
            field: change.field,
            oldValue: change.old,
            newValue: change.new
          }))
        } : undefined
      };
    });
    
    // Cache the processed alerts
    setCache(cacheKey, alerts);
    console.log(`[CACHE] Cached ${alerts.length} alerts for user ${username} for 30 seconds`);
    
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts data' });
  }
});

// Mark alert as read
app.post('/api/alerts/:username/read/:alertId', async (req, res) => {
  try {
    const { username, alertId } = req.params;
    const pool = await getDbConnection();
    
    if (!pool) {
      return res.status(503).json({ error: 'Database connection unavailable' });
    }
    
    // Check if already marked as read
    const checkResult = await pool.request()
      .input('alertId', sql.VarChar, alertId)
      .input('username', sql.VarChar, username)
      .query(`
        SELECT ID FROM TBL_IT_AlertReadStatus 
        WHERE AlertID = @alertId AND UserID = @username
      `);
    
    if (checkResult.recordset.length > 0) {
      return res.json({ success: true, message: 'Alert already marked as read' });
    }
    
    // Get machine ID from the alert
    const alertResult = await pool.request()
      .input('alertId', sql.VarChar, alertId)
      .query(`
        SELECT MachineID FROM TBL_IT_MachineChangeLog 
        WHERE ChangeID = @alertId
      `);
    
    const machineID = alertResult.recordset[0]?.MachineID || '';
    
    // Insert read status
    await pool.request()
      .input('alertId', sql.VarChar, alertId)
      .input('username', sql.VarChar, username)
      .input('machineID', sql.VarChar, machineID)
      .query(`
        INSERT INTO TBL_IT_AlertReadStatus (AlertID, UserID, MachineID)
        VALUES (@alertId, @username, @machineID)
      `);
    
    res.json({ success: true, message: 'Alert marked as read' });
  } catch (err) {
    console.error('Error marking alert as read:', err);
    res.status(500).json({ error: 'Failed to mark alert as read', details: err.message });
  }
});

// Mark all alerts as read for a user
app.post('/api/alerts/:username/read-all', async (req, res) => {
  try {
    const { username } = req.params;
    const pool = await getDbConnection();
    
    if (!pool) {
      return res.status(503).json({ error: 'Database connection unavailable' });
    }
    
    // Get all unread alerts for this user
    const unreadResult = await pool.request()
      .input('username', sql.VarChar, username)
      .query(`
        SELECT c.ChangeID, c.MachineID
        FROM TBL_IT_MachineChangeLog c
        WHERE c.SnapshotJson_Old IS NOT NULL 
          AND c.SnapshotJson_Old != '{}' 
          AND c.SnapshotJson_Old != ''
          AND c.ChangeID NOT IN (
            SELECT AlertID FROM TBL_IT_AlertReadStatus WHERE UserID = @username
          )
      `);
    
    // Insert read status for all unread alerts
    for (const alert of unreadResult.recordset) {
      try {
        await pool.request()
          .input('alertId', sql.VarChar, alert.ChangeID.toString())
          .input('username', sql.VarChar, username)
          .input('machineID', sql.VarChar, alert.MachineID || '')
          .query(`
            INSERT INTO TBL_IT_AlertReadStatus (AlertID, UserID, MachineID)
            VALUES (@alertId, @username, @machineID)
          `);
      } catch (insertError) {
        // Skip if already exists (unique constraint)
        console.log(`Skipping alert ${alert.ChangeID} - may already be marked as read`);
      }
    }
    
    res.json({ 
      success: true, 
      message: `Marked ${unreadResult.recordset.length} alerts as read` 
    });
  } catch (err) {
    console.error('Error marking all alerts as read:', err);
    res.status(500).json({ error: 'Failed to mark all alerts as read', details: err.message });
  }
});

// Get read status for alerts
app.get('/api/alerts/:username/read-status', async (req, res) => {
  try {
    const { username } = req.params;
    const pool = await getDbConnection();
    
    if (!pool) {
      return res.status(503).json({ error: 'Database connection unavailable' });
    }
    
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query(`
        SELECT AlertID, ReadDate
        FROM TBL_IT_AlertReadStatus 
        WHERE UserID = @username
      `);
    
    const readAlerts = result.recordset.reduce((acc, row) => {
      acc[row.AlertID] = row.ReadDate;
      return acc;
    }, {});
    
    res.json(readAlerts);
  } catch (err) {
    console.error('Error getting read status:', err);
    res.status(500).json({ error: 'Failed to get read status', details: err.message });
  }
});

// Get online status for a specific computer
app.get('/api/computers/:machineID/status', async (req, res) => {
  try {
    const { machineID } = req.params;
    const pool = await getDbConnection();
    const result = await pool.request()
      .input('machineID', sql.VarChar, machineID)
      .query(`
        SELECT 
          MachineID,
          ComputerName,
          UpdatedAt,
          DATEDIFF(MINUTE, UpdatedAt, GETUTCDATE()) as minutesSinceUpdate
        FROM [mes].[dbo].[TBL_IT_MachinesCurrent]
        WHERE MachineID = @machineID
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Computer not found' });
    }

    const computer = result.recordset[0];
    const isOnline = computer.minutesSinceUpdate <= 10; // 10 minutes threshold
    
    res.json({
      machineID: computer.MachineID,
      computerName: computer.ComputerName,
      updatedAt: computer.UpdatedAt,
      minutesSinceUpdate: computer.minutesSinceUpdate,
      status: isOnline ? 'online' : 'offline',
      isOnline
    });
  } catch (err) {
    console.error('Error fetching computer status:', err);
    res.status(500).json({ error: 'Failed to fetch computer status' });
  }
});

// VNC API endpoints
app.post('/api/vnc/start', async (req, res) => {
  try {
    const { host = process.env.DEFAULT_VNC_HOST || 'localhost', port = 5900, webPort = 6081 } = req.body;
    
    console.log(`Starting noVNC for ${host}:${port}`);
    
    // Check if noVNC is already running
    const isRunning = await checkNovncStatus();
    
    if (isRunning) {
      console.log('noVNC is already running');
      res.json({
        success: true,
        message: 'noVNC is already running',
        url: `${process.env.NOVNC_URL || `http://${HOST}:6081`}/vnc.html?host=${host}&port=${port}&password=123`
      });
      return;
    }
    
    // Start noVNC process
    const { spawn } = await import('child_process');
    const path = await import('path');
    
    const novncDir = path.join(process.cwd(), 'noVNC');
    
    // Check if noVNC directory exists
    const fs = await import('fs');
    if (!fs.existsSync(novncDir)) {
      console.log('noVNC directory not found');
      res.status(500).json({
        success: false,
        message: 'noVNC directory not found. Please run: git clone https://github.com/novnc/noVNC.git'
      });
      return;
    }
    
    console.log('Starting websockify...');
    
    // Kill any existing websockify processes
    try {
      const { exec } = await import('child_process');
      if (process.platform === 'win32') {
        exec('taskkill /f /im python.exe', () => {});
        // Wait a bit for processes to be killed
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        exec('pkill -f websockify', () => {});
      }
    } catch (error) {
      console.log('No existing websockify processes to kill');
    }
    
    // Start websockify process with better error handling
    const target = `${host}:${port}`;
    console.log(`Starting websockify with target: ${target}`);
    
    // Use platform-specific command to prevent terminal window
    let websockifyProcess;
    if (process.platform === 'win32') {
      websockifyProcess = spawn('python', [
        '-m', 'websockify',
        webPort.toString(),
        target,
        '--web', '.',
        '--verbose',
        '--log-file', `websockify-${host}-${port}.log`
      ], {
        cwd: novncDir,
        detached: true,
        stdio: 'ignore' // Ignore all stdio to prevent terminal window
      });
    } else {
      websockifyProcess = spawn('nohup', ['python3', '-m', 'websockify',
        webPort.toString(),
        target,
        '--web', '.',
        '--verbose',
        '--log-file', `websockify-${host}-${port}.log`
      ], {
        cwd: novncDir,
        detached: true,
        stdio: 'ignore' // Ignore all stdio to prevent terminal window
      });
    }
    
    console.log(`Websockify started with PID: ${websockifyProcess.pid}`);
    
    // Wait for noVNC to start with better checking
    setTimeout(async () => {
      const newStatus = await checkNovncStatus();
      console.log(`noVNC status: ${newStatus}`);
      
      if (!newStatus) {
        console.log('noVNC failed to start, checking logs...');
        try {
          const logContent = fs.readFileSync('websockify.log', 'utf8');
          console.log('Websockify log:', logContent);
        } catch (error) {
          console.log('No log file found');
        }
      }
    }, 3000);
    
    res.json({
      success: true,
      message: 'noVNC started',
      url: `${process.env.NOVNC_URL || `http://${HOST}:6081`}/vnc.html?host=${host}&port=${port}&password=123`,
      target: `${host}:${port}`
    });
    
  } catch (error) {
    console.error('Error starting VNC:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start noVNC',
      error: error.message
    });
  }
});

// Helper function to check noVNC status
async function checkNovncStatus() {
  try {
    const { default: fetch } = await import('node-fetch');
    const response = await fetch(`${process.env.NOVNC_URL || `http://${HOST}:6081`}`, { 
      timeout: 2000,
      method: 'HEAD'
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// VNC API Endpoints

// VNC Health check
app.get('/api/vnc/health', (req, res) => {
  res.json({
    status: 'healthy',
    activeSessions: activeSessions.size,
    authenticatedUsers: authenticatedUsers.size,
    portRange: PORT_RANGE,
    maxSessions: PORT_RANGE.end - PORT_RANGE.start + 1,
          database: connectionStatus
  });
});

// VNC User authentication - Simplified (no database check, just session management)
app.post('/api/vnc/login', async (req, res) => {
  try {
    const { username } = req.body;
    
    console.log('[VNC Login] Attempt for user:', username);
    
    if (!username) {
      console.log('[VNC Login] Missing username');
      return res.status(400).json({ success: false, message: 'Username required' });
    }

    // Check if user is already logged in elsewhere
    if (authenticatedUsers.has(username)) {
      console.log(`[VNC Login] User ${username} already logged in, kicking old session`);
      
      // Cleanup old session
      const oldUserInfo = authenticatedUsers.get(username);
      console.log(`[VNC Login] Old session created at: ${oldUserInfo.authenticatedAt}`);
      
      // Cleanup any active VNC sessions for this user
      for (const [port, session] of activeSessions.entries()) {
        if (session.username === username) {
          console.log(`[VNC Login] Cleaning up old VNC session on port ${port} for user: ${username}`);
          cleanupSession(port);
        }
      }
      
      // Kick WebSocket clients
      kickUserClients(username);
      
      // Remove old authentication
      authenticatedUsers.delete(username);
      console.log(`[VNC Login] Removed old session for user: ${username}`);
    }

    // Create new authentication
    authenticatedUsers.set(username, {
      username,
      authenticatedAt: new Date(),
      lastActivity: new Date()
    });
    
    console.log('[VNC Login] Success for user:', username);
    console.log('[VNC Login] Total authenticated users:', authenticatedUsers.size);
    console.log('[VNC Login] All users:', Array.from(authenticatedUsers.keys()));
    
    res.json({
      success: true,
      message: 'VNC access granted',
      user: { username },
      replacedOldSession: true
    });
  } catch (error) {
    console.error('[VNC Login] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// VNC User logout
app.post('/api/vnc/logout', async (req, res) => {
  try {
    const { username } = req.body;
    
    console.log('[VNC Logout] Attempt for user:', username);
    
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username required' });
    }

    if (authenticatedUsers.has(username)) {
      authenticatedUsers.delete(username);
      console.log('[VNC Logout] Success for user:', username);
      
      // Cleanup any active VNC sessions for this user
      for (const [port, session] of activeSessions.entries()) {
        if (session.username === username) {
          console.log(`[VNC Logout] Cleaning up VNC session on port ${port} for user: ${username}`);
          cleanupSession(port);
        }
      }
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } else {
      res.json({
        success: true,
        message: 'User not logged in'
      });
    }
  } catch (error) {
    console.error('[VNC Logout] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get VNC session status
app.get('/api/vnc/sessions/status', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username required' });
    }

    const isAuthenticated = authenticatedUsers.has(username);
    const userSessions = [];
    
    if (isAuthenticated) {
      for (const [port, session] of activeSessions.entries()) {
        if (session.username === username) {
          userSessions.push({
            port: session.port,
            host: session.host,
            targetPort: session.targetPort,
            sessionId: session.sessionId
          });
        }
      }
    }
    
    res.json({
      success: true,
      isAuthenticated,
      userSessions,
      totalAuthenticatedUsers: authenticatedUsers.size,
      totalActiveSessions: activeSessions.size
    });
  } catch (error) {
    console.error('[VNC Session Status] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Start VNC session - Simplified (no authentication check)
app.post('/api/vnc/start-session', async (req, res) => {
  try {
    const { host, port = 5900, sessionId, username = 'default' } = req.body;
    
    console.log('[VNC Start Session] Request:', { host, port, username });
    
    if (!host) {
      console.log('[VNC Start Session] Missing host');
      return res.status(400).json({
        success: false,
        message: 'Host required'
      });
    }

    // Auto-authenticate user if not exists
    if (!authenticatedUsers.has(username)) {
      console.log('[VNC Start Session] Auto-authenticating user:', username);
      authenticatedUsers.set(username, {
        username,
        authenticatedAt: new Date(),
        lastActivity: new Date()
      });
    } else {
      // Update last activity
      const currentUserInfo = authenticatedUsers.get(username);
      currentUserInfo.lastActivity = new Date();
      authenticatedUsers.set(username, currentUserInfo);
    }
    
    console.log('[VNC Start Session] User ready:', username);

    // 🎯 STEP 1: Validate prerequisites for 100% accuracy
    try {
      await validateVNCPrerequisites(host, port);
    } catch (error) {
      console.error(`❌ [VNC VALIDATE] Prerequisites failed for ${host}:${port}:`, error.message);
      return res.status(400).json({
        success: false,
        message: `VNC validation failed: ${error.message}`,
        details: 'Please check if the target machine is accessible and VNC server is running'
      });
    }

    // Kill all existing sessions for this user (Single Session Policy)
    const sessionsToKill = [];
    console.log(`[VNC Start Session] Checking existing sessions for user: ${username}`);
    console.log(`[VNC Start Session] Current active sessions:`, Array.from(activeSessions.keys()));
    
    for (const [sessionPort, session] of activeSessions) {
      if (session.username === username) {
        sessionsToKill.push(sessionPort);
        console.log(`[VNC Start Session] Found existing session on port ${sessionPort} for user: ${username}`);
      }
    }
    
    // Kill existing sessions with proper cleanup
    for (const sessionPort of sessionsToKill) {
      console.log(`[VNC Start Session] Killing existing session on port ${sessionPort} for user: ${username}`);
      await cleanupSession(sessionPort);
      // Wait longer for proper cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Double-check cleanup by killing any remaining sessions for this user
    const remainingSessions = [];
    for (const [sessionPort, session] of activeSessions) {
      if (session.username === username) {
        remainingSessions.push(sessionPort);
      }
    }
    
    if (remainingSessions.length > 0) {
      console.log(`[VNC Start Session] Force killing remaining sessions:`, remainingSessions);
      for (const sessionPort of remainingSessions) {
        await cleanupSession(sessionPort);
      }
      // Wait for final cleanup
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Find available port
    console.log(`[VNC Start Session] Current active sessions before port selection:`, Array.from(activeSessions.keys()));
    const websockifyPort = findAvailablePort();
    console.log(`[VNC Start Session] Selected port: ${websockifyPort}`);
    if (!websockifyPort) {
      return res.status(503).json({
        success: false,
        message: 'No available ports for new session'
      });
    }

    // Kill any existing websockify process on this port
    await killWebsockify(websockifyPort);

    // Start websockify process (no password required) - Cross-platform
    let websockifyProcess;
    
        // Detect platform and use appropriate command to run in background
    
    if (process.platform === 'win32') {
      // Windows: Use python.exe (not pythonw) for better compatibility
      const pythonCommand = 'python';
      console.log(`[VNC] Using Python command: ${pythonCommand} on Windows`);
      console.log(`[VNC] Command: ${pythonCommand} -m websockify ${websockifyPort} ${host}:${port}`);
      
      websockifyProcess = spawn(pythonCommand, [
        '-m', 'websockify', 
        websockifyPort.toString(), 
        `${host}:${port}`, 
        '--web', path.join(process.cwd(), 'noVNC'), 
        '--verbose', 
        '--log-file', `websockify-${host}-${port}.log`,
        '--idle-timeout', '300'
      ], {
        cwd: path.join(process.cwd(), 'noVNC'),
        stdio: 'ignore', // Ignore all stdio to prevent terminal window
        detached: true, // Run in background
        env: {
          ...process.env,
          PYTHONWARNINGS: 'ignore',
          PYTHONPATH: path.join(process.cwd(), 'noVNC')
        }
      });
    } else {
      // Linux/Mac: Use nohup to run in background
      // Try to detect the correct Python command
      let pythonCommand = 'python3';
      
      // Check if python3 is available, fallback to python
      try {
        const { exec } = await import('child_process');
        const util = await import('util');
        const execPromise = util.promisify(exec);
        
        // Try python3 first
        try {
          await execPromise('python3 --version');
          pythonCommand = 'python3';
        } catch (error) {
          // Try python
          try {
            await execPromise('python --version');
            pythonCommand = 'python';
          } catch (error2) {
            console.error('❌ [VNC ERROR] No Python found. Please install Python 3.x');
            throw new Error('Python not found. Please install Python 3.x');
          }
        }
      } catch (error) {
        console.error('❌ [VNC ERROR] Error checking Python:', error.message);
        throw error;
      }
      
      console.log(`[VNC] Using Python command: ${pythonCommand} on ${process.platform}`);
      
      // Check if websockify module is available
      try {
        const { exec } = await import('child_process');
        const util = await import('util');
        const execPromise = util.promisify(exec);
        
        await execPromise(`${pythonCommand} -c "import websockify; print('websockify available')"`);
        console.log(`✅ [VNC] Websockify module is available`);
      } catch (error) {
        console.error(`❌ [VNC ERROR] Websockify module not found. Installing...`);
        
        // Try to install websockify
        try {
          const { exec } = await import('child_process');
          const util = await import('util');
          const execPromise = util.promisify(exec);
          
          console.log(`📦 [VNC] Installing websockify...`);
          await execPromise(`${pythonCommand} -m pip install websockify`);
          console.log(`✅ [VNC] Websockify installed successfully`);
        } catch (installError) {
          console.error(`❌ [VNC ERROR] Failed to install websockify:`, installError.message);
          throw new Error('Websockify module not found and could not be installed');
        }
      }
      
      websockifyProcess = spawn('nohup', [pythonCommand, '-W', 'ignore', '-m', 'websockify', websockifyPort.toString(), `${host}:${port}`, '--web', path.join(process.cwd(), 'noVNC'), '--verbose', '--log-file', `websockify-${host}-${port}.log`, '--idle-timeout', '300'], {
        cwd: path.join(process.cwd(), 'noVNC'),
        stdio: 'ignore', // Changed to ignore all stdio to prevent terminal window
        detached: true,
        env: {
          ...process.env,
          PYTHONWARNINGS: 'ignore',
          PYTHONPATH: path.join(process.cwd(), 'noVNC')
        }
      });
    }

    // Handle process events with detailed logging for 100% accuracy
    websockifyProcess.on('error', (error) => {
      console.error(`❌ [VNC ERROR] Websockify process error on port ${websockifyPort}:`, error.message);
      console.error(`❌ [VNC ERROR] Command was: python -m websockify ${websockifyPort} ${host}:${port}`);
      console.error(`❌ [VNC ERROR] Full error:`, error);
      cleanupSession(websockifyPort);
    });

    websockifyProcess.on('exit', (code) => {
      console.log(`⚠️ [VNC EXIT] Websockify process exited on port ${websockifyPort} with code ${code}`);
      console.log(`🎯 [VNC TARGET] Was connecting to: ${host}:${port}`);
      
      if (code !== 0) {
        console.error(`❌ [VNC FAILURE] Websockify process failed with exit code ${code}`);
        console.error(`❌ [VNC FAILURE] Target: ${host}:${port}, Port: ${websockifyPort}`);
        
        // Try to read the log file for more details
        try {
          const fs = require('fs');
          const path = require('path');
          const logFile = path.join(process.cwd(), 'noVNC', `websockify-${host}-${port}.log`);
          if (fs.existsSync(logFile)) {
            const logContent = fs.readFileSync(logFile, 'utf8');
            console.error('📋 [VNC LOG]:', logContent);
          }
        } catch (logError) {
          console.error('Could not read websockify log:', logError.message);
        }
      }
      cleanupSession(websockifyPort);
    });

    // Note: stdout and stderr are ignored due to stdio: 'ignore' setting
    // All output will be logged to the log file instead

    // Store session information
    const sessionInfo = {
      port: websockifyPort,
      host,
      targetPort: port,
      process: websockifyProcess,
      createdAt: new Date(),
      sessionId: sessionId || `session_${websockifyPort}`,
      username
    };

    activeSessions.set(websockifyPort, sessionInfo);
    if (sessionId) {
      activeSessions.set(sessionId, sessionInfo);
    }

    // Update user activity
    const userInfo = authenticatedUsers.get(username);
    if (userInfo) {
      userInfo.lastActivity = new Date();
    }

    console.log(`🎉 [VNC SUCCESS] Started session for ${username}`);
    console.log(`📡 [VNC SUCCESS] Proxy: localhost:${websockifyPort} → Target: ${host}:${port}`);
    console.log(`🔧 [VNC SUCCESS] Process PID: ${websockifyProcess.pid}`);

    // Wait a moment for websockify to start and verify it's running
    setTimeout(async () => {
      // Verify process is still running
      try {
        const { exec } = await import('child_process');
        const util = await import('util');
        const execPromise = util.promisify(exec);
        
        if (process.platform === 'win32') {
          const checkProcess = await execPromise(`tasklist /FI "PID eq ${websockifyProcess.pid}"`);
          if (checkProcess.stdout.includes(websockifyProcess.pid.toString())) {
            console.log(`✅ [VNC VERIFY] Process ${websockifyProcess.pid} is still running`);
          } else {
            console.log(`⚠️ [VNC VERIFY] Process ${websockifyProcess.pid} is not running`);
          }
        } else {
          // For Mac/Linux, check if process is running
          try {
            const checkProcess = await execPromise(`ps -p ${websockifyProcess.pid}`);
            if (checkProcess.stdout.includes(websockifyProcess.pid.toString())) {
              console.log(`✅ [VNC VERIFY] Process ${websockifyProcess.pid} is still running`);
            } else {
              console.log(`⚠️ [VNC VERIFY] Process ${websockifyProcess.pid} is not running`);
            }
          } catch (psError) {
            console.log(`⚠️ [VNC VERIFY] Could not check process status: ${psError.message}`);
          }
        }
      } catch (error) {
        console.log(`⚠️ [VNC VERIFY] Could not verify process status: ${error.message}`);
      }
      res.json({
        success: true,
        message: 'VNC session started successfully',
        session: {
          port: websockifyPort,
          host,
          targetPort: port,
          sessionId: sessionInfo.sessionId,
          vncUrl: `${process.env.NOVNC_URL || `http://${HOST}:6081`}/vnc.html?autoconnect=true&resize=scale&scale_cursor=true&clip=true&shared=true&repeaterID=&password=123`.replace(':6081', `:${websockifyPort}`),
          fallbackUrl: `vnc://:123@${host}:${port}`, // Fallback for direct VNC connection
          platform: process.platform,
          pythonCommand: process.platform === 'win32' ? 'python' : 'python3'
        }
      });
    }, 1000);

      } catch (error) {
      console.error('Start VNC session error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
        platform: process.platform,
        details: 'Check if Python and websockify are installed correctly',
        solution: process.platform === 'darwin' ? 'On Mac, try: brew install python3 && pip3 install websockify' : 'Install Python and websockify',
        commands: process.platform === 'darwin' ? [
          'brew install python3',
          'pip3 install websockify',
          'python3 -c "import websockify; print(\'OK\')"'
        ] : [
          'pip install websockify',
          'python -c "import websockify; print(\'OK\')"'
        ],
        troubleshooting: process.platform === 'darwin' ? [
          '1. Install Python 3: brew install python3',
          '2. Install websockify: pip3 install websockify',
          '3. Test: python3 -c "import websockify; print(\'OK\')"',
          '4. Restart the server'
        ] : [
          '1. Install Python: https://python.org',
          '2. Install websockify: pip install websockify',
          '3. Test: python -c "import websockify; print(\'OK\')"',
          '4. Restart the server'
        ],
        note: 'VNC requires Python and websockify to proxy VNC connections to web browsers',
        alternative: 'If VNC still fails, try using the Windows server at 10.51.101.49:8080',
        workaround: 'For Mac users: Use the Windows server URL directly: http://10.51.101.49:8080',
        quickFix: process.platform === 'darwin' ? 'Run: brew install python3 && pip3 install websockify' : 'Install Python and websockify',
        status: 'Python/websockify dependency issue detected',
        recommendation: 'Use Windows server for VNC until Python dependencies are resolved on Mac'
      });
    }
});

// Get active VNC sessions
app.get('/api/vnc/sessions', (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username || !authenticatedUsers.has(username)) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userSessions = Array.from(activeSessions.values())
      .filter(session => session.username === username)
      .map(session => ({
        port: session.port,
        host: session.host,
        targetPort: session.targetPort,
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        vncUrl: `${process.env.NOVNC_URL || `http://${HOST}:6081`}/vnc.html?autoconnect=true&resize=scale&scale_cursor=true&clip=true&shared=true&repeaterID=&password=123`.replace(':6081', `:${session.port}`)
      }));

    res.json({
      success: true,
      sessions: userSessions
    });
  } catch (error) {
    console.error('Get VNC sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Stop specific VNC session
app.delete('/api/vnc/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { username } = req.query;
    
    if (!username || !authenticatedUsers.has(username)) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.username !== username) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    cleanupSession(session.port);
    if (sessionId !== session.sessionId) {
      activeSessions.delete(sessionId);
    }

    res.json({
      success: true,
      message: 'Session stopped successfully'
    });
  } catch (error) {
    console.error('Stop VNC session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get VNC statistics
app.get('/api/vnc/stats', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username || !authenticatedUsers.has(username)) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const totalUsers = 100; // Fallback value
    const activeSessionCount = activeSessions.size;
    const authenticatedUserCount = authenticatedUsers.size;
    const availableSessions = PORT_RANGE.end - PORT_RANGE.start + 1 - activeSessionCount;

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeSessions: activeSessionCount,
        authenticatedUsers: authenticatedUserCount,
        availableSessions,
        portRange: PORT_RANGE,
        maxSessions: PORT_RANGE.end - PORT_RANGE.start + 1
      }
    });
  } catch (error) {
    console.error('Get VNC stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/vnc/status', async (req, res) => {
  try {
    const isRunning = await checkNovncStatus();
    
    res.json({
      success: true,
      isRunning,
      port: 6081,
      message: isRunning ? 'noVNC is running' : 'noVNC is not running'
    });
  } catch (error) {
    console.error('Error checking VNC status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check VNC status',
      error: error.message
    });
  }
});

app.post('/api/vnc/connect', async (req, res) => {
  try {
    const { host, port = 5900, password } = req.body;
    
    if (!host) {
      return res.status(400).json({
        success: false,
        message: 'Host is required'
      });
    }
    
    const novncUrl = `http://${HOST}:${NOVNC_PORT}/vnc.html?host=${host}&port=${port}&password=123`;
    
    // Create window.open JavaScript code
    const windowOpenScript = `
      <script>
        window.open('${novncUrl}', 'vnc_window', 
          'width=1200,height=800,scrollbars=no,resizable=yes,status=no,location=no,toolbar=no,menubar=no');
      </script>
    `;
    
    res.json({
      success: true,
      message: 'VNC connection initiated',
      url: novncUrl,
      windowOpenScript: windowOpenScript,
      config: { host, port, password: password ? '***' : undefined }
    });
  } catch (error) {
    console.error('Error connecting to VNC:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to VNC',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const now = Date.now();
  const lastTestTime = pool?.lastTestTime || 0;
  const timeSinceLastTest = now - lastTestTime;
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: {
      status: connectionStatus,
      server: sqlConfig.server,
      database: sqlConfig.database,
      connectionAttempts: connectionAttempts,
      maxAttempts: maxConnectionAttempts,
      lastTestTime: lastTestTime ? new Date(lastTestTime).toISOString() : null,
      timeSinceLastTest: timeSinceLastTest > 0 ? `${Math.floor(timeSinceLastTest / 1000)}s ago` : 'Never'
    },
    fallback: connectionStatus === 'disconnected' || connectionStatus === 'failed' ? 'Using fallback data' : 'Connected to database',
    nextRetry: connectionStatus === 'failed' && connectionAttempts < maxConnectionAttempts ? 
      `Retrying in ${Math.max(0, 30 - (Date.now() % 30000) / 1000).toFixed(1)}s` : null
  });
});

// Manual retry endpoint
app.post('/api/retry-connection', (req, res) => {
  connectionAttempts = 0; // Reset retry count
  createConnectionPool();
  res.json({ 
    message: 'Connection retry initiated',
    status: connectionStatus
  });
});

// Cleanup VNC sessions on server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  for (const [port, session] of activeSessions) {
    cleanupSession(port);
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  for (const [port, session] of activeSessions) {
    cleanupSession(port);
  }
  process.exit(0);
});

// Alerts API endpoints
app.get('/api/alerts', async (req, res) => {
  try {
    const { page = 1, limit = 50, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT TOP (${limit}) 
        [ChangeID],
        [MachineID],
        [ChangeDate],
        [ChangedSUser],
        [SnapshotJson_Old],
        [SnapshotJson_New],
        [Changes]
      FROM [mes].[dbo].[TBL_IT_MachineChangeLog]
      WHERE [SnapshotJson_Old] IS NOT NULL 
        AND [SnapshotJson_Old] != '{}' 
        AND [SnapshotJson_Old] != 'null'
        AND [SnapshotJson_New] IS NOT NULL
      ORDER BY [ChangeDate] DESC
    `;
    
    if (unreadOnly === 'true') {
      // For now, we'll consider recent alerts (last 24 hours) as unread
      query = `
        SELECT TOP (${limit}) 
          [ChangeID],
          [MachineID],
          [ChangeDate],
          [ChangedSUser],
          [SnapshotJson_Old],
          [SnapshotJson_New],
          [Changes]
        FROM [mes].[dbo].[TBL_IT_MachineChangeLog]
        WHERE [ChangeDate] >= DATEADD(hour, -24, GETDATE())
          AND [SnapshotJson_Old] IS NOT NULL 
          AND [SnapshotJson_Old] != '{}' 
          AND [SnapshotJson_Old] != 'null'
          AND [SnapshotJson_New] IS NOT NULL
        ORDER BY [ChangeDate] DESC
      `;
    }
    
    const result = await pool.request().query(query);
    
    res.json({
      alerts: result.recordset,
      total: result.recordset.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

app.get('/api/alerts/summary', async (req, res) => {
  try {
    // Check cache first
    if (isCacheValid('alerts_summary')) {
      console.log('[CACHE] Returning cached alerts summary');
      return res.json(getCache('alerts_summary'));
    }
    
    const pool = await getDbConnection();
    
    if (!pool) {
      console.log('[DB] Database not available, returning error for alerts summary');
      return res.status(503).json({ 
        error: 'Database connection unavailable',
        message: 'Unable to connect to database server'
      });
    }
    
    console.log('[DB] Fetching alerts summary from database...');
    const startTime = Date.now();
    
    // OPTIMIZED: Single query with CTE for better performance
    const result = await pool.request().query(`
      WITH AlertData AS (
        SELECT 
          [ChangeID],
          [MachineID],
          [ChangeDate],
          [ChangedSUser],
          [SnapshotJson_Old],
          [SnapshotJson_New],
          [Changes],
          CASE 
            WHEN [ChangeDate] >= DATEADD(hour, -24, GETDATE()) THEN 1 
            ELSE 0 
          END as isRecent,
          CASE 
            WHEN [Changes] LIKE '%"status"%' AND [Changes] LIKE '%"offline"%' 
                 AND [ChangeDate] >= DATEADD(hour, -24, GETDATE()) THEN 1 
            ELSE 0 
          END as isHighPriority
        FROM [mes].[dbo].[TBL_IT_MachineChangeLog] WITH (NOLOCK)
        WHERE [SnapshotJson_Old] IS NOT NULL 
          AND [SnapshotJson_Old] != '{}' 
          AND [SnapshotJson_Old] != 'null'
          AND [SnapshotJson_New] IS NOT NULL
      )
      SELECT 
        (SELECT COUNT(*) FROM AlertData) as totalAlerts,
        (SELECT COUNT(*) FROM AlertData WHERE isRecent = 1) as unreadAlerts,
        (SELECT COUNT(*) FROM AlertData WHERE isHighPriority = 1) as highPriorityAlerts,
        (SELECT TOP (5) 
          [ChangeID],
          [MachineID],
          [ChangeDate],
          [ChangedSUser],
          [SnapshotJson_Old],
          [SnapshotJson_New],
          [Changes]
         FROM AlertData 
         ORDER BY [ChangeDate] DESC
         FOR JSON PATH) as recentAlerts
    `);
    
    const queryTime = Date.now() - startTime;
    console.log(`[DB] Alerts summary query completed in ${queryTime}ms`);
    
    const row = result.recordset[0];
    const recentAlerts = row.recentAlerts ? JSON.parse(row.recentAlerts) : [];
    
    const summary = {
      totalAlerts: row.totalAlerts,
      unreadAlerts: row.unreadAlerts,
      highPriorityAlerts: row.highPriorityAlerts,
      recentAlerts: recentAlerts
    };
    
    // Cache the result for 30 seconds
    setCache('alerts_summary', summary);
    console.log(`[CACHE] Cached alerts summary for 30 seconds`);
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching alert summary:', error);
    res.status(500).json({ error: 'Failed to fetch alert summary' });
  }
});

app.put('/api/alerts/:changeId/read', async (req, res) => {
  try {
    const { changeId } = req.params;
    
    // For now, we'll just return success
    // In a real implementation, you might want to add a "Read" column to the table
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
});

app.put('/api/alerts/read-all', async (req, res) => {
  try {
    // For now, we'll just return success
    // In a real implementation, you might want to update all recent alerts
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all alerts as read:', error);
    res.status(500).json({ error: 'Failed to mark all alerts as read' });
  }
});

app.get('/api/alerts/realtime', async (req, res) => {
  try {
    // Get alerts from the last 5 minutes for real-time updates (excluding insert records)
    const result = await pool.request().query(`
      SELECT TOP (10)
        [ChangeID],
        [MachineID],
        [ChangeDate],
        [ChangedSUser],
        [SnapshotJson_Old],
        [SnapshotJson_New],
        [Changes]
      FROM [mes].[dbo].[TBL_IT_MachineChangeLog]
      WHERE [ChangeDate] >= DATEADD(minute, -5, GETDATE())
        AND [SnapshotJson_Old] IS NOT NULL 
        AND [SnapshotJson_Old] != '{}' 
        AND [SnapshotJson_Old] != 'null'
        AND [SnapshotJson_New] IS NOT NULL
      ORDER BY [ChangeDate] DESC
    `);
    
    res.json({
      alerts: result.recordset
    });
  } catch (error) {
    console.error('Error fetching realtime alerts:', error);
    res.status(500).json({ error: 'Failed to fetch realtime alerts' });
  }
});

// Create read status table
app.post('/api/setup/create-read-status-table', async (req, res) => {
  try {
    const pool = await getDbConnection();
    
    if (!pool) {
      return res.status(503).json({ error: 'Database connection unavailable' });
    }
    
    // Create table if not exists
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TBL_IT_AlertReadStatus' AND xtype='U')
      CREATE TABLE TBL_IT_AlertReadStatus (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        AlertID VARCHAR(50) NOT NULL,
        UserID VARCHAR(100) NOT NULL,
        ReadDate DATETIME DEFAULT GETDATE(),
        MachineID VARCHAR(200),
        CreatedAt DATETIME DEFAULT GETDATE()
      )
    `);
    
    // Create indexes
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AlertReadStatus_AlertID')
      CREATE INDEX IX_AlertReadStatus_AlertID ON TBL_IT_AlertReadStatus (AlertID)
    `);
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AlertReadStatus_UserID')
      CREATE INDEX IX_AlertReadStatus_UserID ON TBL_IT_AlertReadStatus (UserID)
    `);
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AlertReadStatus_ReadDate')
      CREATE INDEX IX_AlertReadStatus_ReadDate ON TBL_IT_AlertReadStatus (ReadDate)
    `);
    
    // Add unique constraint
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'UQ_AlertReadStatus_AlertUser')
      ALTER TABLE TBL_IT_AlertReadStatus 
      ADD CONSTRAINT UQ_AlertReadStatus_AlertUser UNIQUE (AlertID, UserID)
    `);
    
    res.json({ 
      success: true, 
      message: 'Read status table created successfully' 
    });
  } catch (err) {
    console.error('Error creating read status table:', err);
    res.status(500).json({ 
      error: 'Failed to create read status table', 
      details: err.message 
    });
  }
});

// Test endpoint to clear read status for a user
app.post('/api/test/clear-read-status', async (req, res) => {
  try {
    const { username } = req.body;
    const pool = await getDbConnection();
    
    if (!pool) {
      return res.status(503).json({ error: 'Database connection unavailable' });
    }
    
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query(`
        DELETE FROM TBL_IT_AlertReadStatus 
        WHERE UserID = @username
      `);
    
    res.json({ 
      success: true, 
      message: `Cleared read status for user: ${username}`,
      deletedCount: result.rowsAffected[0]
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to clear read status', 
      details: err.message 
    });
  }
});



// API endpoint to update HUD_Version
app.post('/api/update-hud-version', async (req, res) => {
  try {
    const { machineID, hudVersion } = req.body;
    const pool = await getDbConnection();
    
    if (!pool) {
      return res.status(503).json({ error: 'Database connection unavailable' });
    }
    
    // First, check current data
    const checkBeforeQuery = `
      SELECT MachineID, ComputerName, HUD_Version, UpdatedAt
      FROM [mes].[dbo].[TBL_IT_MachinesCurrent]
      WHERE MachineID = @machineID;
    `;
    
    const beforeResult = await pool.request()
      .input('machineID', sql.VarChar, machineID)
      .query(checkBeforeQuery);
    
    console.log('Current computer data:', beforeResult.recordset[0]);
    
    // Disable trigger temporarily
    console.log('Disabling trigger temporarily...');
    await pool.request().query(`DISABLE TRIGGER TR_IT_MachinesCurrent_Change ON [mes].[dbo].[TBL_IT_MachinesCurrent]`);
    
    // Update HUD_Version
    const updateQuery = `
      UPDATE [mes].[dbo].[TBL_IT_MachinesCurrent]
      SET HUD_Version = @hudVersion,
          UpdatedAt = GETUTCDATE()
      WHERE MachineID = @machineID;
    `;
    
    const result = await pool.request()
      .input('machineID', sql.VarChar, machineID)
      .input('hudVersion', sql.VarChar, hudVersion)
      .query(updateQuery);
    
    console.log(`Rows affected: ${result.rowsAffected[0]}`);
    
    // Re-enable trigger
    console.log('Re-enabling trigger...');
    await pool.request().query(`ENABLE TRIGGER TR_IT_MachinesCurrent_Change ON [mes].[dbo].[TBL_IT_MachinesCurrent]`);
    
    // Check the result after update
    const checkAfterQuery = `
      SELECT MachineID, ComputerName, HUD_Version, UpdatedAt
      FROM [mes].[dbo].[TBL_IT_MachinesCurrent]
      WHERE MachineID = @machineID;
    `;
    
    const afterResult = await pool.request()
      .input('machineID', sql.VarChar, machineID)
      .query(checkAfterQuery);
    
    console.log('Updated computer data:', afterResult.recordset[0]);
    
    res.json({ 
      success: true, 
      message: 'HUD_Version updated successfully',
      before: beforeResult.recordset[0],
      after: afterResult.recordset[0],
      rowsAffected: result.rowsAffected[0]
    });
  } catch (err) {
    console.error('Error updating HUD_Version:', err);
    res.status(500).json({ 
      error: 'Failed to update HUD_Version', 
      details: err.message 
    });
  }
});

// Cache configuration - Optimized for internal network performance
const cache = {
  computers: {
    data: null,
    timestamp: null,
    ttl: 15000 // 15 seconds cache for faster updates
  },
  alerts: {
    data: null,
    timestamp: null,
    ttl: 10000 // 10 seconds cache for real-time alerts
  },
  alerts_summary: {
    data: null,
    timestamp: null,
    ttl: 10000 // 10 seconds cache for alerts summary
  },
  ip_groups: {
    data: null,
    timestamp: null,
    ttl: 30000 // 30 seconds cache for IP groups
  }
};

// Dynamic cache for user-specific alerts
const userAlertsCache = new Map();

// Cache helper functions
function isCacheValid(cacheKey) {
  // Check main cache first
  const cacheData = cache[cacheKey];
  if (cacheData && cacheData.data && cacheData.timestamp) {
    const now = Date.now();
    return (now - cacheData.timestamp) < cacheData.ttl;
  }
  
  // Check user alerts cache
  if (cacheKey.startsWith('alerts_')) {
    const userCache = userAlertsCache.get(cacheKey);
    if (userCache && userCache.timestamp) {
      const now = Date.now();
      return (now - userCache.timestamp) < 30000; // 30 seconds TTL
    }
  }
  
  return false;
}

function setCache(cacheKey, data) {
  if (cacheKey.startsWith('alerts_')) {
    // Store in user alerts cache
    userAlertsCache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
  } else {
    // Store in main cache
    cache[cacheKey] = {
      data: data,
      timestamp: Date.now(),
      ttl: cache[cacheKey]?.ttl || 30000
    };
  }
}

function getCache(cacheKey) {
  if (cacheKey.startsWith('alerts_')) {
    const userCache = userAlertsCache.get(cacheKey);
    return userCache?.data || null;
  }
  return cache[cacheKey]?.data || null;
}

// Clear cache periodically
setInterval(() => {
  const now = Date.now();
  
  // Clear main cache
  Object.keys(cache).forEach(key => {
    if (cache[key] && cache[key].timestamp) {
      if ((now - cache[key].timestamp) > cache[key].ttl) {
        cache[key] = { data: null, timestamp: null, ttl: cache[key].ttl };
        console.log(`[CACHE] Cleared expired cache: ${key}`);
      }
    }
  });
  
  // Clear user alerts cache
  for (const [key, value] of userAlertsCache.entries()) {
    if ((now - value.timestamp) > 30000) { // 30 seconds TTL
      userAlertsCache.delete(key);
      console.log(`[CACHE] Cleared expired user cache: ${key}`);
    }
  }
}, 60000); // Check every minute

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  testConnection();
});