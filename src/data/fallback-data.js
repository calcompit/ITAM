// Fallback data when database is unavailable
export const fallbackComputers = [
  {
    machineID: 'FALLBACK-001',
    computerName: 'Fallback-PC-1',
    ipAddresses: ['192.168.1.100'],
    domain: 'FALLBACK.LOCAL',
    sUser: 'fallback_user',
    status: 'offline',
    cpu: { model: 'Intel Core i5-8400', physicalCores: 6, logicalCores: 6 },
    ram: { totalGB: 8, modules: [{ size: 8, type: 'DDR4' }] },
    storage: { totalGB: 500, devices: [{ size: 500, type: 'SSD' }] },
    gpu: [{ model: 'Intel UHD Graphics 630', memory: 0 }],
    nics: [{ name: 'Ethernet', ip: '192.168.1.100' }],
    os: { caption: 'Windows 10 Pro', version: '10.0.19045', installDate: '2023-01-01' },
    lastBoot: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    winActivated: true,
    isPinned: false
  },
  {
    machineID: 'FALLBACK-002',
    computerName: 'Fallback-PC-2',
    ipAddresses: ['192.168.1.101'],
    domain: 'FALLBACK.LOCAL',
    sUser: 'fallback_user',
    status: 'offline',
    cpu: { model: 'AMD Ryzen 5 3600', physicalCores: 6, logicalCores: 12 },
    ram: { totalGB: 16, modules: [{ size: 16, type: 'DDR4' }] },
    storage: { totalGB: 1000, devices: [{ size: 1000, type: 'HDD' }] },
    gpu: [{ model: 'NVIDIA GTX 1660', memory: 6 }],
    nics: [{ name: 'Ethernet', ip: '192.168.1.101' }],
    os: { caption: 'Windows 11 Pro', version: '10.0.22621', installDate: '2023-06-01' },
    lastBoot: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    winActivated: false,
    isPinned: false
  }
];

export const fallbackIPGroups = [
  {
    subnet: '192.168.1.x',
    totalComputers: 2,
    onlineCount: 0,
    offlineCount: 2,
    alertCount: 0
  }
];

export const fallbackAnalytics = {
  totalComputers: 2,
  cpuTypes: { 'Intel Core i5': 1, 'AMD Ryzen 5': 1 },
  ramDistribution: { '8GB': 1, '16GB': 1 },
  storageDistribution: { '500GB': 1, '1TB': 1 },
  activatedCount: 1,
  notActivatedCount: 1,
  onlineCount: 0,
  offlineCount: 2
};
