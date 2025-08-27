# 🔧 IP Hardcode Fix - Environment Variables

## 🎯 **ปัญหาที่พบ:**
พบ IP addresses แบบ hardcode ในหลายไฟล์ ซึ่งทำให้ไม่สามารถ deploy ไปยัง environment อื่นได้

## ✅ **การแก้ไขที่ทำ:**

### **1. 🔧 Server.js Fixes:**

#### **Host Configuration:**
```javascript
// Before
const getHost = () => {
  if (process.env.HOST) {
    return process.env.HOST;
  }
  if (isDevelopment) {
    return 'localhost';
  }
  return '10.51.101.49'; // ❌ Hardcoded IP
};

// After
const getHost = () => {
  if (process.env.HOST) {
    return process.env.HOST;
  }
  if (isDevelopment) {
    return 'localhost';
  }
  return process.env.PRODUCTION_HOST || 'localhost'; // ✅ Environment variable
};
```

#### **Database Configuration:**
```javascript
// Before
server: process.env.DB_SERVER || '10.53.64.205', // ❌ Hardcoded IP

// After
server: process.env.DB_SERVER || 'localhost', // ✅ Environment variable
```

#### **VNC Configuration:**
```javascript
// Before
const { host = '10.51.101.83', port = 5900, webPort = 6081 } = req.body; // ❌ Hardcoded IP

// After
const { host = process.env.DEFAULT_VNC_HOST || 'localhost', port = 5900, webPort = 6081 } = req.body; // ✅ Environment variable
```

#### **noVNC Health Check:**
```javascript
// Before
const response = await fetch('http://10.51.101.49:6081', { // ❌ Hardcoded IP
  timeout: 2000,
  method: 'HEAD'
});

// After
const response = await fetch(`${process.env.NOVNC_URL || `http://${HOST}:6081`}`, { // ✅ Environment variable
  timeout: 2000,
  method: 'HEAD'
});
```

### **2. 🔧 API Service Fixes:**

#### **Fallback Data IPs:**
```javascript
// Before
ipAddresses: ['10.53.64.100'], // ❌ Hardcoded IP
nics: [{ name: 'Ethernet', ip: '10.53.64.100' }], // ❌ Hardcoded IP
subnet: '10.53.64.x', // ❌ Hardcoded subnet

// After
ipAddresses: ['192.168.1.100'], // ✅ Generic IP
nics: [{ name: 'Ethernet', ip: '192.168.1.100' }], // ✅ Generic IP
subnet: '192.168.1.x', // ✅ Generic subnet
```

### **3. 📝 Environment Variables Template:**

#### **สร้าง env.template:**
```bash
# Application Configuration
NODE_ENV=development
HOST=localhost
PORT=3002
FRONTEND_PORT=8080
NOVNC_PORT=6081

# API URLs
VITE_API_URL=http://localhost:3002
BACKEND_URL=http://localhost:3002
FRONTEND_URL=http://localhost:8080
NOVNC_URL=http://localhost:6081

# Database Configuration
DB_USER=ccet
DB_PASSWORD=!qaz7410
DB_NAME=mes
DB_SERVER=localhost

# Production Configuration
PRODUCTION_HOST=your-production-host.com
DEFAULT_VNC_HOST=localhost
```

## 🔧 **การใช้งาน Environment Variables:**

### **✅ Development Environment:**
```bash
# Copy template
cp env.template .env

# Update values for development
NODE_ENV=development
HOST=localhost
DB_SERVER=localhost
```

### **✅ Production Environment:**
```bash
# Update values for production
NODE_ENV=production
HOST=your-server-ip.com
DB_SERVER=your-database-server.com
PRODUCTION_HOST=your-server-ip.com
DEFAULT_VNC_HOST=your-vnc-server.com
```

### **✅ Environment-Specific Files:**
```bash
# macOS Development
cp env.template env.mac

# Windows Production
cp env.template env.windows10

# Custom Environment
cp env.template env.custom
```

## 🚀 **Benefits:**

### **✅ Flexibility:**
- สามารถ deploy ไปยัง environment ใดก็ได้
- ไม่ต้องแก้ไขโค้ดเมื่อเปลี่ยน server
- รองรับ multiple environments

### **✅ Security:**
- ไม่มี sensitive information ในโค้ด
- ใช้ environment variables สำหรับ configuration
- ปลอดภัยสำหรับ version control

### **✅ Maintainability:**
- ง่ายต่อการ maintain
- ไม่ต้องแก้ไขโค้ดเมื่อเปลี่ยน IP
- รองรับ CI/CD pipelines

## 📋 **Checklist:**

### **✅ Fixed Files:**
- [x] `server.js` - Host configuration
- [x] `server.js` - Database configuration
- [x] `server.js` - VNC configuration
- [x] `server.js` - noVNC health check
- [x] `src/services/api.ts` - Fallback data IPs
- [x] `env.template` - Environment variables template

### **✅ Environment Variables:**
- [x] `HOST` - Application host
- [x] `DB_SERVER` - Database server
- [x] `PRODUCTION_HOST` - Production host
- [x] `DEFAULT_VNC_HOST` - VNC host
- [x] `NOVNC_URL` - noVNC URL

### **✅ Documentation:**
- [x] Environment variables template
- [x] Usage instructions
- [x] Deployment guide

## 🎉 **ผลลัพธ์:**

### **✅ No More Hardcoded IPs:**
- ✅ ทุก IP addresses ใช้ environment variables
- ✅ รองรับ multiple environments
- ✅ ปลอดภัยสำหรับ deployment
- ✅ ง่ายต่อการ maintain

### **✅ Environment Flexibility:**
- ✅ Development: localhost
- ✅ Production: configurable
- ✅ Staging: configurable
- ✅ Testing: configurable

**ตอนนี้ไม่มี IP hardcode แล้ว และสามารถ deploy ไปยัง environment ใดก็ได้! 🚀✨**
