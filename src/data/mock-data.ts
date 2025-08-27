export interface RAMModule {
  sn: string;
  sizeGB: number;
}

export interface StorageDevice {
  sn: string;
  model: string;
  sizeGB: number;
}

export interface GPU {
  name: string;
}

export interface NetworkCard {
  name: string;
  mac: string;
}

export interface Computer {
  machineID: string;
  computerName: string;
  domain: string;
  uuid: string;
  sUser: string;
  boardSerial: string;
  biosSerial: string;
  cpu: {
    model: string;
    physicalCores: number;
    logicalCores: number;
  };
  ram: {
    totalGB: number;
    modules: RAMModule[];
  };
  storage: {
    totalGB: number;
    devices: StorageDevice[];
  };
  gpu: GPU[];
  nics: NetworkCard[];
  os: {
    caption: string;
    version: string;
    installDate: string;
  };
  lastBoot: string;
  ipAddresses: string[];
  updatedAt: string;
  hudMode: string;
  hudColorARGB: string;
  hudVersion?: string;
  winActivated: boolean;
  status: "online" | "offline" | "alert";
  isPinned?: boolean;
  changelog: Array<{
    changeID: string;
    changeDate: string;
    changedSUser: string;
    eventType: "INSERT" | "UPDATE" | "DELETE";
    changedCount: number;
    changedFields: string;
    changedDetails: Array<{
      field: string;
      old: string;
      new: string;
    }>;
  }>;
}

export const mockComputers: Computer[] = [
  {
    machineID: "2AFF086F02635C0A0F42FC0051AC01B446C1BF455CD9CBA3945A6E3B98591712",
    computerName: "WK-SVR01",
    domain: "WORKGROUP",
    uuid: "4c4c4544-0048-5a10-8035-c2c04f513033",
    sUser: "WK-SVR01\\Dell-PC",
    boardSerial: "/BHZ5Q03/CNWS20099E01N9/",
    biosSerial: "BHZ5Q03",
    cpu: {
      model: "Intel(R) Core(TM) i7-8700 CPU @ 3.20GHz",
      physicalCores: 6,
      logicalCores: 12
    },
    ram: {
      totalGB: 16,
      modules: [
        { sn: "03520411", sizeGB: 8 },
        { sn: "00000066", sizeGB: 8 }
      ]
    },
    storage: {
      totalGB: 350,
      devices: [
        { sn: "122109101835", model: "120GB SATA Flash Drive", sizeGB: 112 },
        { sn: "CN9AN42531250A56N   _00000001.", model: "NVMe BC501 NVMe SK hy", sizeGB: 238 }
      ]
    },
    gpu: [{ name: "Intel(R) UHD Graphics 630" }],
    nics: [
      { name: "Realtek 8811CU Wireless LAN 802.11ac USB NIC", mac: "50:2B:73:CC:00:4D" },
      { name: "Realtek PCIe GbE Family Controller", mac: "AC:15:A2:14:17:CB" },
      { name: "Intel(R) Ethernet Connection (7) I219-LM", mac: "E4:54:E8:BB:B1:A2" },
      { name: "Tailscale Tunnel", mac: "" }
    ],
    os: {
      caption: "Microsoft Windows 11 Pro",
      version: "10.0.26100",
      installDate: "2025-03-28 13:49:46.0000000"
    },
    lastBoot: "2025-08-16 08:57:00.5000000",
    ipAddresses: ["10.13.4.149", "10.51.101.49", "100.73.2.100"],
    updatedAt: "2025-08-20 02:46:24.2996701",
    hudMode: "Normal:80",
    hudColorARGB: "-8355585;-32768",
    hudVersion: "3.0.0",
    winActivated: true,
    status: "online",
    isPinned: true,
    changelog: [
      {
        changeID: "445",
        changeDate: "2025-08-19 19:34:03.1566909",
        changedSUser: "WORKGROUP\\Dell-PC",
        eventType: "UPDATE",
        changedCount: 1,
        changedFields: "RAM_TotalGB",
        changedDetails: [
          { field: "RAM_TotalGB", old: "8", new: "16" }
        ]
      }
    ]
  },
  {
    machineID: "3FE6E321E9B901B3C92F89250EDB76993DE9DF77114014D9EB089A0B221A798F",
    computerName: "CAPROZB0046",
    domain: "pbmfg.calcomp.co.th",
    uuid: "03aa02fc-0414-055b-9906-760700080009",
    sUser: "PBMFG\\pa32",
    boardSerial: "To be filled by O.E.M.",
    biosSerial: "To be filled by O.E.M.",
    cpu: {
      model: "Intel(R) Core(TM) i5-4460 CPU @ 3.20GHz",
      physicalCores: 4,
      logicalCores: 4
    },
    ram: {
      totalGB: 4,
      modules: [
        { sn: "880682C8", sizeGB: 4 }
      ]
    },
    storage: {
      totalGB: 466,
      devices: [
        { sn: "WC90JGC8", model: "ST3500312CS", sizeGB: 466 }
      ]
    },
    gpu: [{ name: "Intel(R) HD Graphics 4600" }],
    nics: [
      { name: "Realtek PCIe GbE Family Controller", mac: "FC:AA:14:5B:99:76" }
    ],
    os: {
      caption: "Microsoft Windows 10 Pro",
      version: "10.0.19045",
      installDate: "2025-08-19T08:08:04"
    },
    lastBoot: "2025-08-19T16:11:21.5000000",
    ipAddresses: ["10.51.101.200"],
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    hudMode: "Normal:80",
    hudColorARGB: "-15461356;-1",
    hudVersion: "2.1.0",
    winActivated: false,
    status: "alert",
    isPinned: true,
    changelog: [
      {
        changeID: "435",
        changeDate: "2025-08-19 19:34:03.1566909",
        changedSUser: "PBMFG\\pa32",
        eventType: "UPDATE",
        changedCount: 1,
        changedFields: "IPv4",
        changedDetails: [
          { field: "IPv4", old: "10.51.101.88", new: "10.51.101.200" }
        ]
      }
    ]
  },
  {
    machineID: "4FE7F421F0C902C4D93F90351FDC87BA4EF0EG88225125EAFC199B1C332B809A",
    computerName: "PROD-SRV-001",
    domain: "company.local",
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    sUser: "COMPANY\\admin",
    boardSerial: "SRV001BOARD",
    biosSerial: "SRV001BIOS",
    cpu: {
      model: "Intel(R) Xeon(R) Silver 4214R CPU @ 2.40GHz",
      physicalCores: 12,
      logicalCores: 24
    },
    ram: {
      totalGB: 32,
      modules: [
        { sn: "RAM001", sizeGB: 16 },
        { sn: "RAM002", sizeGB: 16 }
      ]
    },
    storage: {
      totalGB: 1000,
      devices: [
        { sn: "SSD001", model: "Samsung SSD 970 EVO Plus", sizeGB: 1000 }
      ]
    },
    gpu: [{ name: "ASPEED Graphics Family" }],
    nics: [
      { name: "Intel(R) Ethernet Connection X722", mac: "AA:BB:CC:DD:EE:FF" }
    ],
    os: {
      caption: "Ubuntu 22.04.3 LTS",
      version: "5.15.0-88-generic",
      installDate: "2024-01-15T10:30:00"
    },
    lastBoot: "2025-08-20T00:15:30.0000000",
    ipAddresses: ["10.51.109.50"],
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    hudMode: "Server:90",
    hudColorARGB: "-16711936;-1",
    winActivated: true,
    status: "online",
    isPinned: false,
    changelog: [
      {
        changeID: "423",
        changeDate: "2025-08-18 14:20:00.0000000",
        changedSUser: "COMPANY\\admin",
        eventType: "UPDATE",
        changedCount: 1,
        changedFields: "Storage_TotalGB",
        changedDetails: [
          { field: "Storage_TotalGB", old: "500", new: "1000" }
        ]
      }
    ]
  }
];

export interface IPGroup {
  subnet: string;
  totalComputers: number;
  onlineCount: number;
  offlineCount: number;
  alertCount: number;
}

export function getIPGroups(computers: Computer[]): IPGroup[] {
  const groups: { [key: string]: IPGroup } = {};

  computers.forEach(computer => {
    // Use first IP address for subnet grouping
    const primaryIP = computer.ipAddresses[0] || "";
    if (!primaryIP) return;
    
    const subnet = primaryIP.substring(0, primaryIP.lastIndexOf('.')) + '.x';
    
    if (!groups[subnet]) {
      groups[subnet] = {
        subnet,
        totalComputers: 0,
        onlineCount: 0,
        offlineCount: 0,
        alertCount: 0
      };
    }

    groups[subnet].totalComputers++;
    
    switch (computer.status) {
      case 'online':
        groups[subnet].onlineCount++;
        break;
      case 'offline':
        groups[subnet].offlineCount++;
        break;
      case 'alert':
        groups[subnet].alertCount++;
        break;
    }
  });

  return Object.values(groups);
}

export function getComputersBySubnet(computers: Computer[], subnet: string): Computer[] {
  return computers.filter(computer => {
    const primaryIP = computer.ipAddresses[0] || "";
    if (!primaryIP) return false;
    
    const computerSubnet = primaryIP.substring(0, primaryIP.lastIndexOf('.')) + '.x';
    return computerSubnet === subnet;
  });
}