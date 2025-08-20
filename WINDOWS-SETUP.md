# การติดตั้ง VNC Proxy Server บน Windows

## ขั้นตอนการติดตั้ง

### 1. ติดตั้ง Node.js
- ดาวน์โหลด Node.js จาก https://nodejs.org/
- เลือกเวอร์ชัน LTS (Long Term Support)
- ติดตั้งโดยใช้ค่าเริ่มต้น

### 2. คัดลอกไฟล์ไปยัง Windows Server (IP: 10.51.101.49)
ไฟล์ที่จำเป็น:
- `vnc-proxy.js`
- `vnc-proxy-package.json`
- `public/novnc.js`
- `start-vnc-proxy.bat`
- `VNC-PROXY-README.md`

### 3. ติดตั้ง Dependencies
เปิด Command Prompt ในโฟลเดอร์ที่มีไฟล์ และรัน:
```cmd
npm install
```

### 4. ตั้งค่า Firewall
เปิด PowerShell เป็น Administrator และรัน:
```powershell
netsh advfirewall firewall add rule name="VNC Proxy Server" dir=in action=allow protocol=TCP localport=8081
```

### 5. รัน VNC Proxy Server
```cmd
npm start
```
หรือดับเบิลคลิก `start-vnc-proxy.bat`

## การใช้งาน

### URL หลัก
```
http://10.51.101.49:8081/vnc.html
```

### URL พร้อมพารามิเตอร์
```
http://10.51.101.49:8081/vnc.html?ip=192.168.1.100&port=5900&password=123
```

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **Port 8081 ถูกใช้งานอยู่**
   - เปลี่ยน port ในไฟล์ `vnc-proxy.js` เป็น port อื่น
   - อัปเดต URL ในไฟล์อื่นๆ ให้ตรงกัน

2. **ไม่สามารถเชื่อมต่อได้**
   - ตรวจสอบ Firewall settings
   - ตรวจสอบว่า VNC server เปิดอยู่

3. **Error: RFB is not a constructor**
   - ✅ แก้ไขแล้ว - ใช้ local noVNC library

## การตั้งค่าแบบถาวร

### Windows Service
```cmd
npm install -g pm2
pm2 start vnc-proxy.js --name "vnc-proxy"
pm2 startup
pm2 save
```

### Auto-start
1. สร้าง shortcut ของ `start-vnc-proxy.bat`
2. กด Win+R และพิมพ์ `shell:startup`
3. คัดลอก shortcut ไปยัง Startup folder
