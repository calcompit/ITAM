# VNC ใช้งานง่าย

## 🚀 วิธีใช้งาน VNC

### 1. เริ่มต้น VNC
```bash
# เริ่ม VNC ด้วย IP เริ่มต้น (172.17.124.179)
./start-vnc.sh

# หรือเริ่มด้วย IP ที่ต้องการ
./start-vnc.sh 10.51.104.105 5900
```

### 2. เปิด VNC ใน Browser
```
http://localhost:6081/vnc.html
```

### 3. เปลี่ยน Target IP
```bash
# เปลี่ยนไปยัง IP ใหม่
./change-vnc-target.sh 10.51.104.105 5900

# หรือใช้ IP อื่น
./change-vnc-target.sh 192.168.1.100 5900
```

### 4. หยุด VNC
```bash
pkill -f "websockify.*6081"
```

## 📋 คำสั่งที่ใช้บ่อย

| คำสั่ง | ความหมาย |
|--------|----------|
| `./start-vnc.sh` | เริ่ม VNC ด้วย IP เริ่มต้น |
| `./start-vnc.sh <ip> <port>` | เริ่ม VNC ด้วย IP และ port ที่กำหนด |
| `./change-vnc-target.sh <ip>` | เปลี่ยน target IP |
| `pkill -f "websockify.*6081"` | หยุด VNC |

## 🌐 URL ที่ใช้

- **VNC Client**: `http://localhost:6081/vnc.html`
- **Port**: 6081
- **Default Password**: 123

## ✅ ข้อดีของวิธีนี้

1. **ง่าย**: ไม่ต้องใช้ API ซับซ้อน
2. **เร็ว**: เปลี่ยน IP ได้ทันที
3. **เสถียร**: ใช้ websockify มาตรฐาน
4. **ยืดหยุ่น**: รองรับ IP และ port ต่างๆ

## 🔧 การแก้ไขปัญหา

### VNC ไม่เชื่อมต่อ
```bash
# เช็คว่า websockify รันอยู่หรือไม่
ps aux | grep websockify

# รีสตาร์ท VNC
./start-vnc.sh <ip> <port>
```

### Port ถูกใช้งาน
```bash
# หยุด websockify เก่า
pkill -f "websockify.*6081"

# เริ่มใหม่
./start-vnc.sh <ip> <port>
```
