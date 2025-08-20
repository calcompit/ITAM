# TightVNC Setup Guide

## วิธีใช้ TightVNC แทน Web VNC Viewer

### ข้อดีของ TightVNC:
- ✅ **เสถียรกว่า** - ไม่มีปัญหา ECONNRESET
- ✅ **เร็วกว่า** - การแสดงผลเร็วกว่า web-based
- ✅ **ปลอดภัยกว่า** - ใช้ VNC protocol มาตรฐาน
- ✅ **ง่ายกว่า** - ไม่ต้องแก้ไขโค้ดเพิ่มเติม

## การติดตั้ง

### 1. ดาวน์โหลดและติดตั้ง TightVNC
- ดาวน์โหลดจาก: https://www.tightvnc.com/
- ติดตั้งที่ `C:\Program Files\TightVNC\`

### 2. ไฟล์ที่ใช้:
- `start-tightvnc.bat` - สำหรับเชื่อมต่อ VNC
- `start-tightvnc-server.bat` - สำหรับเริ่ม VNC server

## วิธีใช้งาน

### วิธีที่ 1: ใช้ TightVNC Viewer (แนะนำ)

1. **เปิดไฟล์ `start-tightvnc.bat`**
   ```cmd
   start-tightvnc.bat
   ```

2. **หรือเปิด TightVNC Viewer เอง:**
   ```cmd
   "C:\Program Files\TightVNC\tvnviewer.exe" -host=10.51.101.83 -port=5900 -password=123
   ```

### วิธีที่ 2: ใช้ TightVNC Server

1. **เริ่ม VNC server บนเครื่องที่ต้องการควบคุม:**
   ```cmd
   start-tightvnc-server.bat
   ```

2. **เชื่อมต่อจากเครื่องอื่น:**
   ```cmd
   start-tightvnc.bat
   ```

## การตั้งค่า

### แก้ไข IP Address:
เปิดไฟล์ `start-tightvnc.bat` และแก้ไข:
```batch
set VNC_IP=10.51.101.83  REM เปลี่ยนเป็น IP ที่ต้องการ
set VNC_PORT=5900        REM เปลี่ยนเป็น port ที่ต้องการ
set VNC_PASSWORD=123     REM เปลี่ยนเป็น password ที่ต้องการ
```

### แก้ไข Port และ Password:
เปิดไฟล์ `start-tightvnc-server.bat` และแก้ไข:
```batch
set VNC_PORT=5900        REM เปลี่ยนเป็น port ที่ต้องการ
set VNC_PASSWORD=123     REM เปลี่ยนเป็น password ที่ต้องการ
```

## การแก้ไขปัญหา

### ปัญหา: TightVNC ไม่พบ
```
ERROR: TightVNC not found at "C:\Program Files\TightVNC\tvnviewer.exe"
```
**วิธีแก้:**
1. ตรวจสอบว่า TightVNC ติดตั้งถูกต้อง
2. แก้ไข path ในไฟล์ .bat ให้ตรงกับที่ติดตั้ง

### ปัญหา: เชื่อมต่อไม่ได้
**วิธีแก้:**
1. ตรวจสอบ IP address และ port
2. ตรวจสอบ firewall settings
3. ตรวจสอบว่า VNC server กำลังทำงาน

### ปัญหา: Password ไม่ถูกต้อง
**วิธีแก้:**
1. ตรวจสอบ password ในไฟล์ .bat
2. ตรวจสอบ password ที่ตั้งไว้ใน VNC server

## คำสั่งเพิ่มเติม

### ดูรายการ VNC servers ที่ใช้งาน:
```cmd
"C:\Program Files\TightVNC\tvnviewer.exe" -list
```

### เริ่ม VNC server แบบ service:
```cmd
"C:\Program Files\TightVNC\tvnserver.exe" -install
"C:\Program Files\TightVNC\tvnserver.exe" -start
```

### หยุด VNC server service:
```cmd
"C:\Program Files\TightVNC\tvnserver.exe" -stop
"C:\Program Files\TightVNC\tvnserver.exe" -uninstall
```

## ข้อแนะนำ

1. **ใช้ TightVNC แทน Web VNC** - เสถียรกว่าและเร็วกว่า
2. **ตั้งค่า Firewall** - เปิด port 5900 สำหรับ VNC
3. **ใช้ Password ที่แข็งแกร่ง** - เพื่อความปลอดภัย
4. **ตรวจสอบ Network** - ให้แน่ใจว่า network อนุญาต VNC traffic

## การเปรียบเทียบ

| คุณสมบัติ | Web VNC | TightVNC |
|-----------|---------|----------|
| ความเสถียร | ❌ มีปัญหา ECONNRESET | ✅ เสถียร |
| ความเร็ว | ❌ ช้า | ✅ เร็ว |
| การติดตั้ง | ❌ ซับซ้อน | ✅ ง่าย |
| ความปลอดภัย | ⚠️ ผ่าน web | ✅ มาตรฐาน VNC |
| การใช้งาน | ❌ ต้องแก้โค้ด | ✅ ใช้งานได้ทันที |

**แนะนำ: ใช้ TightVNC แทน Web VNC viewer**
