# VNC Proxy Server สำหรับ Windows

## การติดตั้งและใช้งาน

### 1. ติดตั้ง Node.js
- ดาวน์โหลดและติดตั้ง Node.js จาก https://nodejs.org/
- เลือกเวอร์ชัน LTS (Long Term Support)

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. รัน VNC Proxy Server
```bash
npm start
```

หรือ
```bash
node vnc-proxy.js
```

หรือดับเบิลคลิกไฟล์ `start-vnc-proxy.bat`

### 4. เข้าถึง VNC Viewer
- เปิดเบราว์เซอร์ไปที่: `http://10.51.101.49:8081/vnc.html`
- หรือใช้ URL พร้อมพารามิเตอร์: `http://10.51.101.49:8081/vnc.html?ip=192.168.1.100&port=5900&password=123`

## การใช้งาน

### พารามิเตอร์ URL
- `ip`: IP address ของ VNC server
- `port`: Port ของ VNC server (default: 5900)
- `password`: รหัสผ่าน VNC (default: 123)

### ตัวอย่าง URL
```
http://10.51.101.49:8081/vnc.html?ip=192.168.1.100&port=5900&password=123
http://10.51.101.49:8081/vnc.html?ip=10.51.101.50&port=5901&password=mypassword
```

## การตั้งค่า Firewall

### Windows Firewall
1. เปิด Windows Defender Firewall
2. เพิ่ม Exception สำหรับ port 8080
3. อนุญาต Node.js ผ่าน Firewall

### คำสั่ง PowerShell (Run as Administrator)
```powershell
netsh advfirewall firewall add rule name="VNC Proxy Server" dir=in action=allow protocol=TCP localport=8081
```

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **ไม่สามารถเชื่อมต่อได้**
   - ตรวจสอบว่า VNC server เปิดอยู่
   - ตรวจสอบ Firewall settings
   - ตรวจสอบ IP และ Port

2. **Error: RFB is not a constructor**
   - ✅ **แก้ไขแล้ว** - ใช้ local noVNC library แทน CDN
   - ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
   - ลองรีเฟรชหน้าเว็บ

3. **Connection timeout**
   - ตรวจสอบว่า VNC server รันอยู่
   - ตรวจสอบ Network connectivity

4. **exports is not defined**
   - ✅ **แก้ไขแล้ว** - ใช้ local noVNC library ที่ไม่มี module loading issues

### Logs
Server จะแสดง logs ใน console:
```
VNC proxy server running on http://0.0.0.0:8081
VNC HTML page available at: http://10.51.101.49:8081/vnc.html
VNC proxy WebSocket connection established
VNC proxy connecting to 192.168.1.100:5900
Connected to VNC server 192.168.1.100:5900
```

## การตั้งค่าแบบถาวร

### Windows Service (Optional)
สามารถตั้งค่าให้รันเป็น Windows Service ได้โดยใช้ tools เช่น:
- PM2: `npm install -g pm2 && pm2 start vnc-proxy.js`
- NSSM: สำหรับสร้าง Windows Service

### Auto-start
เพิ่มใน Windows Startup:
1. สร้าง batch file: `start-vnc-proxy.bat`
2. เพิ่มใน Windows Startup folder
3. หรือใช้ Task Scheduler

## ความปลอดภัย

### คำแนะนำ
- ใช้ HTTPS ใน production
- ตั้งค่า Authentication
- จำกัด IP ที่เข้าถึงได้
- ใช้ Strong passwords

### การตั้งค่าเพิ่มเติม
แก้ไขไฟล์ `vnc-proxy.js` เพื่อเพิ่มความปลอดภัย:
- เพิ่ม IP whitelist
- เพิ่ม Authentication
- ใช้ SSL/TLS

## การอัปเดตล่าสุด

### ✅ แก้ไขปัญหาแล้ว
1. **RFB is not a constructor** - ใช้ local noVNC library
2. **exports is not defined** - ไม่ใช้ CDN ที่มี module loading issues
3. **Connection errors** - เพิ่ม error handling ที่ดีขึ้น
4. **VNC protocol support** - เพิ่มการจัดการ mouse และ keyboard events

### ไฟล์ที่สำคัญ
- `vnc-proxy.js` - VNC proxy server
- `public/novnc.js` - Local noVNC library
- `start-vnc-proxy.bat` - Windows batch file
- `vnc-proxy-package.json` - Package configuration
