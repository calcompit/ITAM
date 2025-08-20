# VNC Proxy Server สำหรับ Windows

## การติดตั้งและใช้งาน

### 1. ติดตั้ง Node.js
- ดาวน์โหลดและติดตั้ง Node.js จาก https://nodejs.org/
- เลือกเวอร์ชัน LTS (Long Term Support)
- ติดตั้งโดยใช้ค่าเริ่มต้น

### 2. คัดลอกไฟล์ไปยัง Windows Server (IP: 10.51.101.49)
ไฟล์ที่จำเป็น:
- `vnc-proxy-simple.js` - VNC proxy server
- `public/novnc.js` - Local noVNC library
- `WINDOWS-SETUP.md` - คู่มือการใช้งาน

### 3. ติดตั้ง Dependencies
เปิด Command Prompt ในโฟลเดอร์ที่มีไฟล์ และรัน:
```cmd
npm install ws
```

### 4. ตั้งค่า Firewall
เปิด PowerShell เป็น Administrator และรัน:
```powershell
netsh advfirewall firewall add rule name="VNC Proxy Server" dir=in action=allow protocol=TCP localport=8081
```

### 5. รัน VNC Proxy Server
```cmd
node vnc-proxy-simple.js
```

## การใช้งาน

### URL หลัก
```
http://10.51.101.49:8081/vnc.html
```

### URL พร้อมพารามิเตอร์
```
http://10.51.101.49:8081/vnc.html?ip=192.168.1.100&port=5900&password=123
```

## ฟีเจอร์

### ✅ **ฟีเจอร์ที่รองรับ:**
- **VNC Protocol Authentication** - การยืนยันตัวตนกับ VNC server
- **Screen Data Display** - แสดงข้อมูลหน้าจอจาก VNC server
- **Mouse Input** - ส่ง mouse events (click, move, scroll)
- **Keyboard Input** - ส่ง keyboard events
- **Fullscreen Mode** - โหมดเต็มหน้าจอ
- **Connection Status** - แสดงสถานะการเชื่อมต่อ
- **Error Handling** - จัดการข้อผิดพลาด

### 🎮 **การควบคุม:**
- **Mouse:** คลิก, ลาก, เลื่อน
- **Keyboard:** พิมพ์, กดปุ่มต่างๆ
- **Fullscreen:** กดปุ่ม "Fullscreen"
- **Reconnect:** กดปุ่ม "Reconnect" เมื่อการเชื่อมต่อขาด

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **Port 8081 ถูกใช้งานอยู่**
   - เปลี่ยน port ในไฟล์ `vnc-proxy-simple.js` เป็น port อื่น
   - อัปเดต URL ในไฟล์อื่นๆ ให้ตรงกัน

2. **ไม่สามารถเชื่อมต่อได้**
   - ตรวจสอบ Firewall settings
   - ตรวจสอบว่า VNC server เปิดอยู่
   - ตรวจสอบ IP และ Port

3. **Error: ECONNRESET**
   - VNC server ปิดการเชื่อมต่อ
   - ตรวจสอบว่า VNC server รันอยู่
   - ลอง reconnect

4. **Error: RFB is not a constructor**
   - ✅ แก้ไขแล้ว - ใช้ local noVNC library

### Logs
Server จะแสดง logs ใน console:
```
VNC proxy server running on http://0.0.0.0:8081
VNC HTML page available at: http://10.51.101.49:8081/vnc.html
Enhanced VNC viewer with screen display support
VNC proxy WebSocket connection established
VNC proxy connecting to 192.168.1.100:5900
Connected to VNC server 192.168.1.100:5900
```

## การตั้งค่าแบบถาวร

### Windows Service
```cmd
npm install -g pm2
pm2 start vnc-proxy-simple.js --name "vnc-proxy"
pm2 startup
pm2 save
```

### Auto-start
1. สร้าง batch file: `start-vnc.bat`
   ```batch
   @echo off
   cd /d "C:\path\to\your\vnc\folder"
   node vnc-proxy-simple.js
   pause
   ```
2. กด Win+R และพิมพ์ `shell:startup`
3. คัดลอก shortcut ของ batch file ไปยัง Startup folder

## ความปลอดภัย

### คำแนะนำ
- ใช้ HTTPS ใน production
- ตั้งค่า Authentication
- จำกัด IP ที่เข้าถึงได้
- ใช้ Strong passwords

### การตั้งค่าเพิ่มเติม
แก้ไขไฟล์ `vnc-proxy-simple.js` เพื่อเพิ่มความปลอดภัย:
- เพิ่ม IP whitelist
- เพิ่ม Authentication
- ใช้ SSL/TLS

## การอัปเดตล่าสุด

### ✅ **เวอร์ชันปัจจุบัน:**
- **VNC Protocol Support** - รองรับ VNC protocol พื้นฐาน
- **Screen Display** - แสดงข้อมูลหน้าจอ
- **Input Handling** - รองรับ mouse และ keyboard
- **Error Recovery** - การกู้คืนจากข้อผิดพลาด
- **Enhanced UI** - หน้าจอที่ใช้งานง่าย

### 📁 **ไฟล์ที่สำคัญ:**
- `vnc-proxy-simple.js` - VNC proxy server หลัก
- `public/novnc.js` - Local noVNC library
- `WINDOWS-SETUP.md` - คู่มือการใช้งาน
