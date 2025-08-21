# IT Asset Monitor - Windows Setup with WebSockify

คู่มือการติดตั้งและใช้งาน IT Asset Monitor บน Windows พร้อม WebSockify สำหรับ VNC

## การติดตั้ง

### 1. ติดตั้ง Python 3
- ดาวน์โหลด Python 3 จาก https://www.python.org/downloads/
- ติดตั้งโดยเลือก "Add Python to PATH"
- ตรวจสอบการติดตั้ง: `python --version`

### 2. ติดตั้ง Node.js
- ดาวน์โหลด Node.js จาก https://nodejs.org/
- ติดตั้ง Node.js
- ตรวจสอบการติดตั้ง: `node --version`

### 3. ติดตั้ง WebSockify
รันไฟล์ `install-websockify.bat` หรือใช้คำสั่ง:
```cmd
pip install websockify
```

## การใช้งาน

### เริ่มต้นใช้งาน
1. รันไฟล์ `start-all.bat`
2. รอให้ระบบเริ่มต้นเสร็จ
3. เปิดเบราว์เซอร์ไปที่: http://10.51.101.49:8081

### URLs ที่ใช้งานได้
- **Frontend Dashboard:** http://10.51.101.49:8081
- **Backend API:** http://10.51.101.49:3002
- **WebSockify (VNC):** http://10.51.101.49:6081

## การใช้งาน VNC

### การเชื่อมต่อ VNC
1. คลิกที่ไอคอนตา (👁️) ข้าง IP address
2. ระบบจะเปิด VNC viewer ในเบราว์เซอร์
3. กรอกรหัสผ่าน VNC (default: 123)

### การแก้ไขปัญหา VNC

#### ปัญหา: VNC ไม่เชื่อมต่อ
**วิธีแก้:**
1. ตรวจสอบว่า Python และ websockify ติดตั้งแล้ว
2. ตรวจสอบว่าไฟร์วอลล์อนุญาต port 6081-6100
3. ตรวจสอบว่า VNC server ทำงานบนเครื่องเป้าหมาย

#### ปัญหา: WebSockify ไม่เริ่มต้น
**วิธีแก้:**
1. รัน `install-websockify.bat` อีกครั้ง
2. ตรวจสอบ log ในโฟลเดอร์ noVNC
3. ตรวจสอบว่า Python อยู่ใน PATH

#### ปัญหา: ไม่สามารถเข้าถึง 10.51.101.49
**วิธีแก้:**
1. ตรวจสอบการเชื่อมต่อเครือข่าย
2. ตรวจสอบไฟร์วอลล์ Windows
3. ตรวจสอบว่า IP address ถูกต้อง

## การตั้งค่าไฟร์วอลล์

### เปิด Port ที่จำเป็น
```cmd
netsh advfirewall firewall add rule name="IT Asset Monitor Frontend" dir=in action=allow protocol=TCP localport=8081
netsh advfirewall firewall add rule name="IT Asset Monitor Backend" dir=in action=allow protocol=TCP localport=3002
netsh advfirewall firewall add rule name="IT Asset Monitor WebSockify" dir=in action=allow protocol=TCP localport=6081
```

## การแก้ไขปัญหา

### ตรวจสอบสถานะบริการ
```cmd
netstat -an | findstr :8081
netstat -an | findstr :3002
netstat -an | findstr :6081
```

### ตรวจสอบ Process
```cmd
tasklist | findstr node
tasklist | findstr python
```

### ลบ Process ที่ค้าง
```cmd
taskkill /f /im node.exe
taskkill /f /im python.exe
```

## การอัปเดต

### อัปเดตโค้ด
```cmd
git pull origin main
```

### อัปเดต Dependencies
```cmd
npm install
pip install --upgrade websockify
```

## หมายเหตุ

- ระบบใช้ IP address `10.51.101.49` สำหรับการเข้าถึง
- VNC password default คือ `123`
- WebSockify จะสร้าง port ใหม่สำหรับแต่ละ VNC session
- ระบบจะลบ VNC session อัตโนมัติหลังจาก 30 นาที

## การสนับสนุน

หากมีปัญหา:
1. ตรวจสอบ log ในโฟลเดอร์ noVNC
2. ตรวจสอบการเชื่อมต่อเครือข่าย
3. ตรวจสอบการตั้งค่าไฟร์วอลล์
4. ติดต่อผู้ดูแลระบบ
