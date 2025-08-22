// Fallback data when database is unavailable
// This data is shown when the database connection fails
export const fallbackComputers = [
  {
    machineID: 'DB-OFFLINE-001',
    computerName: 'Database-Offline-Demo-1',
    ipAddresses: ['10.53.64.100'],
    domain: 'CALCOMP.LOCAL',
    sUser: 'admin',
    status: 'offline',
    cpu: { model: 'Intel Core i7-10700', physicalCores: 8, logicalCores: 16 },
    ram: { totalGB: 32, modules: [{ size: 16, type: 'DDR4' }, { size: 16, type: 'DDR4' }] },
    storage: { totalGB: 2000, devices: [{ size: 1000, type: 'SSD' }, { size: 1000, type: 'HDD' }] },
    gpu: [{ model: 'NVIDIA RTX 3060', memory: 12 }],
    nics: [{ name: 'Ethernet', ip: '10.53.64.100' }],
    os: { caption: 'Windows 10 Enterprise', version: '10.0.19045', installDate: '2023-01-15' },
    lastBoot: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    winActivated: true,
    isPinned: false
  },
  {
    machineID: 'DB-OFFLINE-002',
    computerName: 'Database-Offline-Demo-2',
    ipAddresses: ['10.53.64.101'],
    domain: 'CALCOMP.LOCAL',
    sUser: 'user1',
    status: 'offline',
    cpu: { model: 'AMD Ryzen 7 5800X', physicalCores: 8, logicalCores: 16 },
    ram: { totalGB: 64, modules: [{ size: 32, type: 'DDR4' }, { size: 32, type: 'DDR4' }] },
    storage: { totalGB: 4000, devices: [{ size: 2000, type: 'NVMe SSD' }, { size: 2000, type: 'SSD' }] },
    gpu: [{ model: 'AMD Radeon RX 6700 XT', memory: 12 }],
    nics: [{ name: 'Ethernet', ip: '10.53.64.101' }],
    os: { caption: 'Windows 11 Pro', version: '10.0.22621', installDate: '2023-03-20' },
    lastBoot: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    winActivated: true,
    isPinned: false
  },
  {
    machineID: 'DB-OFFLINE-003',
    computerName: 'Database-Offline-Demo-3',
    ipAddresses: ['10.53.64.102'],
    domain: 'CALCOMP.LOCAL',
    sUser: 'user2',
    status: 'offline',
    cpu: { model: 'Intel Core i5-12400', physicalCores: 6, logicalCores: 12 },
    ram: { totalGB: 16, modules: [{ size: 16, type: 'DDR4' }] },
    storage: { totalGB: 1000, devices: [{ size: 1000, type: 'SSD' }] },
    gpu: [{ model: 'Intel UHD Graphics 730', memory: 0 }],
    nics: [{ name: 'Ethernet', ip: '10.53.64.102' }],
    os: { caption: 'Windows 10 Pro', version: '10.0.19045', installDate: '2023-02-10' },
    lastBoot: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    winActivated: false,
    isPinned: false
  }
];

export const fallbackIPGroups = [
  {
    subnet: '10.53.64.x',
    totalComputers: 3,
    onlineCount: 0,
    offlineCount: 3,
    alertCount: 0
  }
];

export const fallbackAnalytics = {
  totalComputers: 3,
  cpuTypes: { 
    'Intel Core i7': 1, 
    'AMD Ryzen 7': 1, 
    'Intel Core i5': 1 
  },
  ramDistribution: { 
    '16GB': 1, 
    '32GB': 1, 
    '64GB': 1 
  },
  storageDistribution: { 
    '1TB': 1, 
    '2TB': 1, 
    '4TB': 1 
  },
  activatedCount: 2,
  notActivatedCount: 1,
  onlineCount: 0,
  offlineCount: 3
};
