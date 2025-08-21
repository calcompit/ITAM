import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import http from 'http';
import { spawn } from 'child_process';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all 10.x.x.x IP addresses (entire 10.0.0.0/8 range)
    if (origin.match(/^https?:\/\/10\.\d+\.\d+\.\d+/)) {
      return callback(null, true);
    }
    
    // Allow localhost for development
    if (origin.match(/^https?:\/\/localhost/)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// SQL Server configuration
const sqlConfig = {
  user: process.env.DB_USER || 'ccet',
  password: process.env.DB_PASSWORD || '!qaz7410',
  database: process.env.DB_NAME || 'mes',
  server: process.env.DB_SERVER || '10.53.64.205',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: 3000,
    requestTimeout: 3000,
    connectionRetryInterval: 500,
    maxRetriesOnTries: 1,
    cancelTimeout: 2000,
    packetSize: 4096,
    useUTC: false,
    // Fix TLS warning by setting proper server name
    serverName: process.env.DB_SERVER || '10.53.64.205'
  },
  pool: {
    max: 5,
    min: 0,
    idleTimeoutMillis: 15000,
    acquireTimeoutMillis: 15000,
    createTimeoutMillis: 15000,
    destroyTimeoutMillis: 3000,
    reapIntervalMillis: 500,
    createRetryIntervalMillis: 100
  }
};

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
  clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(data));
    }
  });
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

// VNC Helper Functions
function findAvailablePort() {
  for (let port = PORT_RANGE.start; port <= PORT_RANGE.end; port++) {
    if (!activeSessions.has(port)) {
      return port;
    }
  }
  return null;
}

async function killWebsockify(port) {
  try {
    const { exec } = await import('child_process');
    return new Promise((resolve) => {
      exec(`pkill -f "websockify.*${port}"`, (error) => {
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

function cleanupSession(port) {
  const session = activeSessions.get(port);
  if (session && session.process) {
    session.process.kill();
  }
  activeSessions.delete(port);
  console.log(`Cleaned up session on port ${port}`);
}

// Fallback data when database is unavailable
const fallbackData = {
  computers: [
    {
      machineID: "DEMO-001",
      computerName: "DESKTOP-HALKGET",
      ipAddresses: ["172.17.124.179"],
      domain: "WORKGROUP",
      sUser: "DESKTOP-HALKGET\\user",
      status: "online",
      cpu: { model: "Intel Core i7", physicalCores: 4, logicalCores: 8 },
      ram: { totalGB: 16, modules: [] },
      storage: { totalGB: 500, devices: [] },
      gpu: [{ name: "Intel HD Graphics" }],
      network: { adapters: [] },
      lastBoot: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      winActivated: true,
      isPinned: false
    },
    {
      machineID: "DEMO-002",
      computerName: "WK-SVR01",
      ipAddresses: ["10.13.4.149"],
      domain: "calcomp.co.th",
      sUser: "calcomp\\admin",
      status: "online",
      cpu: { model: "Intel Xeon", physicalCores: 8, logicalCores: 16 },
      ram: { totalGB: 32, modules: [] },
      storage: { totalGB: 1000, devices: [] },
      gpu: [{ name: "NVIDIA Quadro" }],
      network: { adapters: [] },
      lastBoot: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      winActivated: true,
      isPinned: false
    },
    {
      machineID: "DEMO-003",
      computerName: "P22070400120002",
      ipAddresses: ["10.51.101.83"],
      domain: "pbmfg.calcomp.co.th",
      sUser: "pbmfg\\user",
      status: "online",
      cpu: { model: "AMD Ryzen", physicalCores: 6, logicalCores: 12 },
      ram: { totalGB: 16, modules: [] },
      storage: { totalGB: 500, devices: [] },
      gpu: [{ name: "AMD Radeon" }],
      network: { adapters: [] },
      lastBoot: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      winActivated: true,
      isPinned: false
    }
  ],
  ipGroups: [
    {
      subnet: "172.17.124.x",
      totalComputers: 1,
      onlineCount: 1,
      offlineCount: 0,
      alertCount: 0
    },
    {
      subnet: "10.13.4.x",
      totalComputers: 1,
      onlineCount: 1,
      offlineCount: 0,
      alertCount: 0
    },
    {
      subnet: "10.51.101.x",
      totalComputers: 1,
      onlineCount: 1,
      offlineCount: 0,
      alertCount: 0
    }
  ],
  analytics: {
    totalComputers: 3,
    cpuTypes: { "Intel Core i7": 1, "Intel Xeon": 1, "AMD Ryzen": 1 },
    ramDistribution: { "16GB": 2, "32GB": 1 },
    storageDistribution: { "500GB": 2, "1000GB": 1 },
    activatedCount: 3,
    notActivatedCount: 0,
    onlineCount: 3,
    offlineCount: 0
  }
};

// Database connection status
let dbConnectionStatus = 'disconnected';
let connectionRetryCount = 0;
const maxRetryCount = 10; // เพิ่มจาก 5

// Test database connection
async function testConnection() {
  try {
    const pool = await sql.connect(sqlConfig);
    dbConnectionStatus = 'connected';
    connectionRetryCount = 0; // Reset retry count on success
    
    // Setup realtime monitoring
    await setupRealtimeMonitoring(pool);
  } catch (err) {
    dbConnectionStatus = 'disconnected';
    connectionRetryCount++;
    
    // Auto-retry connection every 5 seconds (ลดจาก 10)
    if (connectionRetryCount < maxRetryCount) {
      setTimeout(() => {
        console.log(`Retrying database connection... (${connectionRetryCount}/${maxRetryCount})`);
        testConnection();
      }, 5000); // 5 seconds (ลดจาก 10)
    } else {
      console.log('Max retry attempts reached. Using fallback data.');
    }
    
    // Fallback to polling when database is unavailable
    startPollingMonitoring();
  }
}

// Setup realtime monitoring using Service Broker
async function setupRealtimeMonitoring(pool) {
  try {
    // Skip Service Broker for now to avoid SQL errors
    // Just use polling instead
    console.log('Using polling monitoring instead of Service Broker');
    startPollingMonitoring();
    
  } catch (err) {
    // Fallback to polling
    startPollingMonitoring();
  }
}

// Create Service Broker objects
async function createServiceBrokerObjects(pool) {
  try {
    // Enable Service Broker on database
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.service_queues WHERE name = 'ITAssetChangeQueue')
      BEGIN
        ALTER DATABASE [mes] SET ENABLE_BROKER;
        
        CREATE MESSAGE TYPE [ITAssetChangeMessage]
        VALIDATION = NONE;
        
        CREATE CONTRACT [ITAssetChangeContract]
        ([ITAssetChangeMessage] SENT BY ANY);
        
        CREATE QUEUE [ITAssetChangeQueue];
        
        CREATE SERVICE [ITAssetChangeService]
        AUTHORIZATION [dbo]
        ON QUEUE [ITAssetChangeQueue]
        ([ITAssetChangeContract]);
      END
    `);
    
  } catch (err) {
    throw err;
  }
}

// Start monitoring for changes using Service Broker
async function startChangeMonitoring(pool) {
  try {
    // Create trigger to send messages when data changes
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_IT_MachinesCurrent_Change')
        DROP TRIGGER [TR_IT_MachinesCurrent_Change]
    `);
    
    await pool.request().query(`
      CREATE TRIGGER [TR_IT_MachinesCurrent_Change]
      ON [mes].[dbo].[TBL_IT_MachinesCurrent]
      AFTER INSERT, UPDATE, DELETE
      AS
      BEGIN
        SET NOCOUNT ON;
        
        DECLARE @message NVARCHAR(MAX);
        DECLARE @changeType NVARCHAR(10);
        
        IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
          SET @changeType = 'UPDATE';
        ELSE IF EXISTS(SELECT * FROM inserted)
          SET @changeType = 'INSERT';
        ELSE
          SET @changeType = 'DELETE';
        
        SET @message = JSON_QUERY((
          SELECT 
            @changeType as changeType,
            GETUTCDATE() as timestamp,
            MachineID,
            ComputerName,
            UpdatedAt,
            Win_Activated
          FROM inserted
        ));
        
        IF @message IS NOT NULL
        BEGIN
          DECLARE @dialog_handle UNIQUEIDENTIFIER;
          BEGIN DIALOG CONVERSATION @dialog_handle
            FROM SERVICE [ITAssetChangeService]
            TO SERVICE 'ITAssetChangeService'
            ON CONTRACT [ITAssetChangeContract]
            WITH ENCRYPTION = OFF;
          
          SEND ON CONVERSATION @dialog_handle
            MESSAGE TYPE [ITAssetChangeMessage]
            (@message);
        END
      END
    `);
    
    // Start listening for messages
    startMessageListener(pool);
    
  } catch (err) {
    throw err;
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

// Fallback: Polling-based monitoring
function startPollingMonitoring() {
  let lastCheck = new Date();
  
  const pollForChanges = async () => {
    try {
      const pool = await sql.connect(sqlConfig);
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
      } else {
        // Use the latest UpdatedAt from the changes
        const latestUpdate = Math.max(...result.recordset.map(r => new Date(r.UpdatedAt).getTime()));
        lastCheck = new Date(latestUpdate);
      }
      pool.close();
      
    } catch (err) {
      console.error('[Real-time] Database polling error:', err.message);
      // Continue polling even if there's an error
    }
    
    // Poll every 5 seconds
    setTimeout(pollForChanges, 5000);
  };
  
  console.log('[Real-time] Starting polling monitoring...');
  pollForChanges();
}

// Get all computers from TBL_IT_MachinesCurrent
app.get('/api/computers', async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);
    
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
          Win_Activated
        FROM [mes].[dbo].[TBL_IT_MachinesCurrent]
        ORDER BY ComputerName
      `);

    const computers = result.recordset.map(row => {
      // Parse JSON fields safely
      const ramModules = row.RAM_ModulesJson ? JSON.parse(row.RAM_ModulesJson) : [];
      const storageDevices = row.Storage_Json ? JSON.parse(row.Storage_Json) : [];
      const gpuList = row.GPU_Json ? JSON.parse(row.GPU_Json) : [];
      const nicList = row.NICs_Json ? JSON.parse(row.NICs_Json) : [];
      
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
                     winActivated: row.Win_Activated === 1 || row.Win_Activated === true,
        status: (() => {
          // Check if the computer is online based on UpdatedAt
          // Convert to Thai time for comparison
          const now = new Date();
          const utcDate = new Date(row.UpdatedAt);
          const thaiDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
          const diffMinutes = (now - thaiDate) / (1000 * 60);
          return diffMinutes <= 10 ? 'online' : 'offline';
        })(),
        isPinned: false
      };
    });
    
    pool.close();
    res.json(computers);
    
  } catch (err) {
    // Return fallback data instead of error
    console.error('Error fetching computers:', err.message);
    console.log('Using fallback data due to database connection error');
    res.json(fallbackData.computers);
  }
});

// Get computer changelog from TBL_IT_MachineChangeLog
app.get('/api/computers/:machineID/changelog', async (req, res) => {
  try {
    const { machineID } = req.params;
    const pool = await sql.connect(sqlConfig);
    

    
    // Use the complex SQL query to compare SnapshotJson_Old and SnapshotJson_New
    const result = await pool.request()
      .input('machineID', sql.VarChar, machineID)
      .query(`
        ;WITH B AS (
            SELECT ChangeID, MachineID, ChangeDate, ChangedSUser,
                   SnapshotJson_Old, SnapshotJson_New
            FROM mes.dbo.TBL_IT_MachineChangeLog
            WHERE MachineID = @machineID
        ),
        Keys AS (
            SELECT b.ChangeID, b.MachineID, b.ChangeDate, b.ChangedSUser,
                   k.[key] COLLATE DATABASE_DEFAULT AS FieldName
            FROM B b
            OUTER APPLY (
                SELECT [key] FROM OPENJSON(b.SnapshotJson_Old)
                UNION
                SELECT [key] FROM OPENJSON(b.SnapshotJson_New)
            ) k
        ),
        DiffRows AS (
            SELECT
                k.ChangeID, k.MachineID, k.ChangeDate, k.ChangedSUser, k.FieldName,
                CAST(COALESCE(JSON_QUERY(b.SnapshotJson_Old, '$.' + k.FieldName),
                              JSON_VALUE(b.SnapshotJson_Old, '$.' + k.FieldName)) AS nvarchar(max)) COLLATE DATABASE_DEFAULT AS OldValue,
                CAST(COALESCE(JSON_QUERY(b.SnapshotJson_New, '$.' + k.FieldName),
                              JSON_VALUE(b.SnapshotJson_New, '$.' + k.FieldName)) AS nvarchar(max)) COLLATE DATABASE_DEFAULT AS NewValue
            FROM Keys k
            JOIN B b ON b.ChangeID = k.ChangeID
        ),
        RowDiffChanged AS (
            SELECT ChangeID, MachineID, ChangeDate, ChangedSUser,
                   FieldName COLLATE DATABASE_DEFAULT AS FieldName,
                   OldValue  COLLATE DATABASE_DEFAULT AS OldValue,
                   NewValue  COLLATE DATABASE_DEFAULT AS NewValue
            FROM DiffRows
            WHERE ISNULL(OldValue, N'') COLLATE DATABASE_DEFAULT
                  <> ISNULL(NewValue, N'') COLLATE DATABASE_DEFAULT
              AND FieldName NOT IN (N'LastBoot', N'UpdatedAt', N'HUD_Mode', N'HUD_ColorARGB')
        ),
        DiffAgg AS (
            SELECT
                c.ChangeID,
                COUNT(*) AS ChangedCount,
                STRING_AGG(c.FieldName COLLATE DATABASE_DEFAULT, N', ')
                    WITHIN GROUP (ORDER BY c.FieldName) AS ChangedFields,
                (
                    SELECT
                        c2.FieldName AS [field],
                        c2.OldValue  AS [old],
                        c2.NewValue  AS [new]
                    FROM RowDiffChanged c2
                    WHERE c2.ChangeID = c.ChangeID
                    FOR JSON PATH
                ) AS ChangedDetailJson
            FROM RowDiffChanged c
            GROUP BY c.ChangeID
        )
        SELECT TOP 50
            b.ChangeID,
            b.MachineID,
            b.ChangeDate,
            b.ChangedSUser,
            EventType =
                CASE 
                    WHEN (b.SnapshotJson_Old IS NULL OR b.SnapshotJson_Old = N'{}')
                         AND (b.SnapshotJson_New IS NOT NULL AND b.SnapshotJson_New <> N'{}')
                        THEN N'INSERT'
                    WHEN (b.SnapshotJson_Old IS NOT NULL AND b.SnapshotJson_Old <> N'{}')
                         AND (b.SnapshotJson_New IS NULL OR b.SnapshotJson_New = N'{}')
                        THEN N'DELETE'
                    WHEN da.ChangedCount IS NOT NULL AND da.ChangedCount > 0
                        THEN N'UPDATE'
                    ELSE N'NO CHANGE'
                END,
            ISNULL(da.ChangedCount, 0)          AS ChangedCount,
            ISNULL(da.ChangedFields, N'')       AS ChangedFields,
            ISNULL(da.ChangedDetailJson, N'[]') AS ChangedDetailJson
        FROM B b
        LEFT JOIN DiffAgg da
          ON da.ChangeID = b.ChangeID
        ORDER BY b.ChangeDate DESC, b.ChangeID DESC
      `);

    const changelog = result.recordset.map(row => {
      let changedDetails = [];
      
      // Parse ChangedDetailJson if it exists
      if (row.ChangedDetailJson && row.ChangedDetailJson !== '[]') {
        try {
          const details = JSON.parse(row.ChangedDetailJson);
          if (Array.isArray(details)) {
            changedDetails = details.map(detail => ({
              field: detail.field || 'Unknown',
              old: detail.old || 'ไม่มีค่า',
              new: detail.new || 'ไม่มีค่า'
            }));
          }
        } catch (e) {
          // If parsing fails, create a fallback
          changedDetails = [{
            field: 'Changes',
            old: 'ไม่ทราบ',
            new: 'ไม่ทราบ'
          }];
        }
      }
      
      return {
        changeID: row.ChangeID,
        changeDate: row.ChangeDate,
        changedSUser: row.ChangedSUser || 'System',
        eventType: row.EventType || 'UPDATE',
        changedCount: row.ChangedCount || 0,
        changedFields: row.ChangedFields || 'Unknown',
        changedDetails: changedDetails
      };
    });

    res.json(changelog);
  } catch (err) {
    console.error('Error fetching changelog:', err.message);
    res.json([]); // Return empty array instead of error
  }
});

// Get IP groups summary
app.get('/api/ip-groups', async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .query(`
        SELECT 
          SUBSTRING(IPv4, 1, CHARINDEX('.', IPv4, CHARINDEX('.', IPv4, CHARINDEX('.', IPv4) + 1) + 1) - 1) + '.x' as subnet,
          COUNT(*) as totalComputers,
          SUM(CASE WHEN DATEDIFF(MINUTE, UpdatedAt, DATEADD(HOUR, 7, GETUTCDATE())) <= 10 THEN 1 ELSE 0 END) as onlineCount,
          SUM(CASE WHEN DATEDIFF(MINUTE, UpdatedAt, DATEADD(HOUR, 7, GETUTCDATE())) > 10 THEN 1 ELSE 0 END) as offlineCount,
          0 as alertCount
        FROM [mes].[dbo].[TBL_IT_MachinesCurrent]
        WHERE IPv4 IS NOT NULL AND IPv4 != ''
        GROUP BY SUBSTRING(IPv4, 1, CHARINDEX('.', IPv4, CHARINDEX('.', IPv4, CHARINDEX('.', IPv4) + 1) + 1) - 1)
        ORDER BY subnet
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching IP groups:', err.message);
    // Return fallback data instead of error
    res.json(fallbackData.ipGroups);
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const pool = await sql.connect(sqlConfig);
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
    const pool = await sql.connect(sqlConfig);
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
    // Return fallback data instead of error
    res.json(fallbackData.analytics);
  }
});

// Alerts endpoint - Get alerts for specific user
app.get('/api/alerts/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const pool = await sql.connect(sqlConfig);
    
            // Get recent changelog entries and convert to alerts
        const result = await pool.request()
          .input('username', sql.NVarChar, username)
          .query(`
            ;WITH B AS (
              SELECT TOP 200
                b.ChangeID, b.MachineID, b.ChangeDate, b.ChangedSUser,
                EventType = CASE 
                  WHEN b.SnapshotJson_Old IS NULL OR b.SnapshotJson_Old = '' THEN N'INSERT'
                  WHEN b.SnapshotJson_New IS NULL OR b.SnapshotJson_New = '' THEN N'DELETE'
                  ELSE N'UPDATE'
                END,
                ISNULL(da.ChangedCount, 0) AS ChangedCount,
                ISNULL(da.ChangedFields, N'') AS ChangedFields,
                ISNULL(da.ChangedDetailJson, N'[]') AS ChangedDetailJson
              FROM [mes].[dbo].[TBL_IT_MachineChangeLog] b
              LEFT JOIN (
                SELECT 
                  ChangeID,
                  COUNT(*) as ChangedCount,
                  STRING_AGG(FieldName, ', ') as ChangedFields,
                  '[' + STRING_AGG(
                    '{"field":"' + FieldName + '","oldValue":"' + ISNULL(OldValue, '') + '","newValue":"' + ISNULL(NewValue, '') + '"}',
                    ','
                  ) + ']' as ChangedDetailJson
                FROM (
                  SELECT 
                    c.ChangeID,
                    JSON_VALUE(c.SnapshotJson_Old, '$.key') as FieldName,
                    JSON_VALUE(c.SnapshotJson_Old, '$.value') as OldValue,
                    JSON_VALUE(c.SnapshotJson_New, '$.value') as NewValue
                  FROM [mes].[dbo].[TBL_IT_MachineChangeLog] c
                  CROSS APPLY OPENJSON(c.SnapshotJson_Old) as old
                  CROSS APPLY OPENJSON(c.SnapshotJson_New) as new
                  WHERE old.[key] = new.[key]
                  AND (old.[value] != new.[value] OR old.[value] IS NULL AND new.[value] IS NOT NULL OR old.[value] IS NOT NULL AND new.[value] IS NULL)
                  AND old.[key] NOT IN ('LastBoot', 'UpdatedAt', 'HUD_Mode', 'HUD_ColorARGB')
                ) changes
                GROUP BY ChangeID
              ) da ON da.ChangeID = b.ChangeID
              WHERE b.ChangedSUser = @username
              ORDER BY b.ChangeDate DESC, b.ChangeID DESC
            )
            SELECT 
              b.ChangeID as id,
              b.MachineID,
              b.ChangeDate as timestamp,
              b.ChangedSUser as username,
              b.EventType,
              b.ChangedCount,
              b.ChangedFields,
              b.ChangedDetailJson,
              mc.ComputerName
            FROM B b
            LEFT JOIN [mes].[dbo].[TBL_IT_MachinesCurrent] mc ON mc.MachineID = b.MachineID
          `);
    
    // Convert to alert format
    const alerts = result.recordset.map(row => {
      const changeDetails = row.ChangedDetailJson ? JSON.parse(row.ChangedDetailJson) : [];
      const firstChange = changeDetails[0] || {};
      
      // Determine alert type and severity based on field changes
      let type = 'system';
      let severity = 'medium';
      
      if (firstChange.field) {
        if (firstChange.field.includes('RAM') || firstChange.field.includes('Storage') || firstChange.field.includes('CPU')) {
          type = 'hardware';
          severity = 'medium';
        } else if (firstChange.field.includes('IP') || firstChange.field.includes('Network')) {
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
        type,
        severity,
        title: `${firstChange.field || 'System'} Changed`,
        description: isOldAlert 
          ? `📖 ${row.EventType} event on ${row.ComputerName || 'Unknown Computer'} - Click to view details`
          : `${row.EventType} event on ${row.ComputerName || 'Unknown Computer'}`,
        computerName: row.ComputerName || 'Unknown Computer',
        timestamp: row.timestamp,
        username: row.username,
        isRead: false, // Will be managed by frontend localStorage
        isOldAlert, // Flag to indicate this is an old alert
        changeDetails: firstChange.field ? {
          field: firstChange.field,
          oldValue: firstChange.oldValue || 'N/A',
          newValue: firstChange.newValue || 'N/A'
        } : undefined
      };
    });
    
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts data' });
  }
});

// Mark alert as read
app.post('/api/alerts/:username/read/:alertId', async (req, res) => {
  try {
    const { username, alertId } = req.params;
    
    // In a real system, you might want to store read status in database
    // For now, we'll just return success (frontend manages read status)
    res.json({ success: true, message: 'Alert marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
});

// Get online status for a specific computer
app.get('/api/computers/:machineID/status', async (req, res) => {
  try {
    const { machineID } = req.params;
    const pool = await sql.connect(sqlConfig);
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
    const isOnline = computer.minutesSinceUpdate <= 10;
    
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
    const { host = '10.51.101.83', port = 5900, webPort = 6081 } = req.body;
    
    console.log(`Starting noVNC for ${host}:${port}`);
    
    // Check if noVNC is already running
    const isRunning = await checkNovncStatus();
    
    if (isRunning) {
      console.log('noVNC is already running');
      res.json({
        success: true,
        message: 'noVNC is already running',
        url: `http://localhost:${webPort}/vnc.html?host=${host}&port=${port}&password=123`
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
    
    const websockifyProcess = spawn('python', [
      '-m', 'websockify',
      webPort.toString(),
      target,
      '--web', '.',
      '--verbose',
      '--log-file', `websockify-${host}-${port}.log`
    ], {
      cwd: novncDir,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
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
      url: `http://10.51.101.49:6081/vnc-module.html?host=${host}&port=${port}&password=123`,
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
              const response = await fetch('http://10.51.101.49:6081', { 
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
    database: dbConnectionStatus
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

    // Check if user already has an active session for the same target
    for (const [sessionPort, session] of activeSessions) {
      if (session.username === username && session.host === host && session.targetPort === port) {
        return res.status(409).json({
          success: false,
          message: 'User already has an active session for this target',
          existingSession: {
            port: session.port,
            host: session.host,
            targetPort: session.targetPort,
            sessionId: session.sessionId
          }
        });
      }
    }

    // Find available port
    const websockifyPort = findAvailablePort();
    if (!websockifyPort) {
      return res.status(503).json({
        success: false,
        message: 'No available ports for new session'
      });
    }

    // Kill any existing websockify process on this port
    await killWebsockify(websockifyPort);

    // Start websockify process (no password required) - Completely silent mode
    const websockifyProcess = spawn('bash', [
      '-c',
      `websockify ${websockifyPort} ${host}:${port} --web noVNC > /dev/null 2>&1 &`
    ], {
      stdio: ['ignore', 'ignore', 'ignore'],
      detached: true
    });

    // Handle process events
    websockifyProcess.on('error', (error) => {
      console.error(`Websockify process error on port ${websockifyPort}:`, error);
      cleanupSession(websockifyPort);
    });

    websockifyProcess.on('exit', (code) => {
      console.log(`Websockify process exited on port ${websockifyPort} with code ${code}`);
      cleanupSession(websockifyPort);
    });

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

    console.log(`Started VNC session for ${username} on port ${websockifyPort} -> ${host}:${port}`);

    res.json({
      success: true,
      message: 'VNC session started successfully',
      session: {
        port: websockifyPort,
        host,
        targetPort: port,
        sessionId: sessionInfo.sessionId,
                    vncUrl: `http://10.51.101.49:${websockifyPort}/vnc.html?autoconnect=true&resize=scale&scale_cursor=true&clip=true&shared=true&repeaterID=&password=123`
      }
    });

  } catch (error) {
    console.error('Start VNC session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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
        vncUrl: `http://10.51.101.49:${session.port}/vnc.html?autoconnect=true&resize=scale&scale_cursor=true&clip=true&shared=true&repeaterID=&password=123`
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
    
    const novncUrl = `http://10.51.101.49:6081/vnc.html?host=${host}&port=${port}&password=123`;
    
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
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: {
      status: dbConnectionStatus,
      server: sqlConfig.server,
      database: sqlConfig.database,
      retryCount: connectionRetryCount,
      maxRetries: maxRetryCount
    },
    fallback: dbConnectionStatus === 'disconnected' ? 'Using fallback data' : 'Connected to database',
    nextRetry: dbConnectionStatus === 'disconnected' && connectionRetryCount < maxRetryCount ? 
      `Retrying in ${Math.max(0, 5 - (Date.now() % 5000) / 1000).toFixed(1)}s` : null
  });
});

// Manual retry endpoint
app.post('/api/retry-connection', (req, res) => {
  connectionRetryCount = 0; // Reset retry count
  testConnection();
  res.json({ 
    message: 'Connection retry initiated',
    retryCount: connectionRetryCount
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

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  testConnection();
});