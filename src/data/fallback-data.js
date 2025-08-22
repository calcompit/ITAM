// Fallback data when database is unavailable
export const fallbackComputers = [
  {
    machineID: 'FALLBACK-001',
    computerName: 'Fallback-PC-1',
    ipAddresses: ['192.168.1.100'],
    domain: 'FALLBACK.LOCAL',
    sUser: 'fallback_user',
    status: 'offline',
    cpu: { model: 'Intel Core i5-8400', cores: 6, speed: 2.8 },
    ram: { totalGB: 8, modules: [{ size: 8, type: 'DDR4' }] },
    storage: { totalGB: 500, drives: [{ size: 500, type: 'SSD' }] },
    gpu: { model: 'Intel UHD Graphics 630', memory: 0 },
    network: { adapters: [{ name: 'Ethernet', ip: '192.168.1.100' }] },
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
    cpu: { model: 'AMD Ryzen 5 3600', cores: 6, speed: 3.6 },
    ram: { totalGB: 16, modules: [{ size: 16, type: 'DDR4' }] },
    storage: { totalGB: 1000, drives: [{ size: 1000, type: 'HDD' }] },
    gpu: { model: 'NVIDIA GTX 1660', memory: 6 },
    network: { adapters: [{ name: 'Ethernet', ip: '192.168.1.101' }] },
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
