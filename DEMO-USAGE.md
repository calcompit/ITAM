# 🎯 VNC Integration Demo & Usage Guide

## 📋 **การทำงานของระบบ (Step by Step)**

### **1. ระบบประกอบด้วย:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   VNC Server    │
│   Port 8080     │◄──►│   Port 3002     │    │   Port 5900     │
│   (Dashboard)   │    │   (API)         │    │   (Target PC)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   noVNC         │    │   WebSocket     │    │   VNC Protocol  │
│   Port 6081     │◄──►│   Proxy         │◄──►│   Connection    │
│   (Web VNC)     │    │   (WebSocket)   │    │   (TCP)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **2. ขั้นตอนการใช้งาน:**

#### **Step 1: เริ่มระบบ**
```bash
# Terminal 1: เริ่ม Backend
node server.js
# รันที่ port 3002

# Terminal 2: เริ่ม Frontend  
npm run dev
# รันที่ port 8080

# Terminal 3: เริ่ม noVNC (เมื่อต้องการ VNC)
python start-novnc-simple.py
# รันที่ port 6081
```

#### **Step 2: เข้า Dashboard**
```
http://localhost:8080
```

#### **Step 3: คลิก IP Address**
- คลิกที่ IP address ใน computer card
- ระบบจะเปิด: `http://localhost:6081/vnc.html?host=IP&port=5900`

#### **Step 4: เชื่อมต่อ VNC**
- ใส่ password: `123`
- คลิก Connect

## 🎬 **จำลองการใช้งาน (Demo)**

### **Scenario: เชื่อมต่อ VNC ไปที่ 10.51.101.83**

#### **1. เปิด Dashboard**
```
http://localhost:8080
```

#### **2. คลิก IP Address**
```
คลิกที่: 10.51.101.83 ใน computer card
```

#### **3. ระบบจะเปิด URL**
```
http://localhost:6081/vnc.html?host=10.51.101.83&port=5900
```

#### **4. noVNC Interface**
```
┌─────────────────────────────────────┐
│  noVNC Web Interface                │
│  ┌─────────────────────────────────┐ │
│  │ Connection Settings:            │ │
│  │ Host: localhost                 │ │
│  │ Port: 6081                      │ │
│  │ Password: 123                   │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### **5. การเชื่อมต่อ**
```
Browser (Port 6081) ←→ noVNC Proxy ←→ VNC Server (10.51.101.83:5900)
```

## 🔧 **Port Explanation**

### **Port 3002 (Backend)**
- **หน้าที่**: IT Asset Monitor API
- **ข้อมูล**: Computer list, IP groups, analytics
- **URL**: `http://10.51.101.49:3002/api/*`

### **Port 8080 (Frontend)**
- **หน้าที่**: React Dashboard
- **ข้อมูล**: UI, User interface
- **URL**: `http://localhost:8080`

### **Port 6081 (noVNC)**
- **หน้าที่**: VNC Web Interface
- **ข้อมูล**: Web-based VNC viewer
- **URL**: `http://localhost:6081/vnc.html`

### **Port 5900 (VNC Server)**
- **หน้าที่**: VNC Server (เครื่องปลายทาง)
- **ข้อมูล**: Remote desktop
- **URL**: `10.51.101.83:5900`

## 🚀 **Quick Test**

### **Test 1: ตรวจสอบ Backend**
```bash
curl http://10.51.101.49:3002/api/health
```

### **Test 2: ตรวจสอบ Frontend**
```bash
curl http://localhost:8080
```

### **Test 3: ตรวจสอบ noVNC**
```bash
curl http://localhost:6081
```

### **Test 4: ตรวจสอบ VNC Server**
```bash
telnet 10.51.101.83 5900
```

## 🎯 **สรุปการใช้งาน**

### **สำหรับ User:**
1. **เปิด Dashboard**: `http://localhost:8080`
2. **คลิก IP Address** ใน computer card
3. **ใส่ Password**: `123`
4. **ใช้งาน VNC** ผ่าน browser

### **สำหรับ Admin:**
1. **เริ่ม Backend**: `node server.js`
2. **เริ่ม Frontend**: `npm run dev`
3. **เริ่ม noVNC**: `python start-novnc-simple.py`
4. **ตรวจสอบ Status**: ดูที่ Dashboard header

## 🔍 **Troubleshooting**

### **ปัญหา: WebSocket connection failed**
**สาเหตุ**: noVNC ไม่ทำงาน
**แก้ไข**: รัน `python start-novnc-simple.py`

### **ปัญหา: Cannot connect to VNC server**
**สาเหตุ**: VNC server ไม่ทำงาน
**แก้ไข**: ตรวจสอบ VNC server ที่เครื่องปลายทาง

### **ปัญหา: Dashboard ไม่แสดงข้อมูล**
**สาเหตุ**: Backend ไม่ทำงาน
**แก้ไข**: รัน `node server.js`

## 📝 **Note**
- **IP Addresses** ใน Dashboard มาจาก Database
- **VNC Connection** ผ่าน noVNC proxy
- **Password** ตั้งเป็น `123` สำหรับทุกเครื่อง
