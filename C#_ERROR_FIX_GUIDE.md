# 🚨 C# Error Fix Guide - Invalid object name 'inserted'

## ❌ Error ที่เกิดขึ้น
```
System.Data.SqlClient.SqlException
Message=Invalid object name 'inserted'.
Source=.Net SqlClient Data Provider
```

## 🔍 สาเหตุของปัญหา
- **Trigger เก่า** ที่ใช้ dynamic SQL ซับซ้อน
- **`inserted` table** ไม่สามารถเข้าถึงได้ใน dynamic SQL context
- **Service Broker** ที่ไม่พร้อมใช้งาน

## ✅ วิธีแก้ไขทันที

### Step 1: รัน SQL Script เพื่อลบ Trigger ที่มีปัญหา
```sql
-- เปิด SQL Server Management Studio หรือ sqlcmd
-- รัน script นี้:

USE [mes]
GO

-- ลบ trigger ที่มีปัญหา
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_IT_MachinesCurrent_Change')
BEGIN
    DROP TRIGGER [TR_IT_MachinesCurrent_Change]
    PRINT 'FIXED: Removed problematic trigger'
END

PRINT 'C# ERROR SHOULD BE FIXED NOW!'
GO
```

### Step 2: หรือใช้ไฟล์ `quick-fix-csharp.sql`
```bash
# ใช้ sqlcmd
sqlcmd -S 10.53.64.205 -U ccet -P !qaz7410 -d mes -i quick-fix-csharp.sql
```

### Step 3: Test C# Application
- รัน C# application ใหม่
- ตรวจสอบว่า error หายไป
- ทดสอบการ insert/update ข้อมูล

## 🔧 การแก้ไขใน Server.js (ทำแล้ว)

### ปิดการใช้งาน Service Broker และ Trigger
```javascript
// Service Broker setup disabled to prevent C# errors
async function createServiceBrokerObjects(pool) {
  console.log('[Service Broker] Skipping Service Broker setup to prevent C# errors');
  // Service Broker setup disabled to prevent C# application errors
}

// Trigger creation disabled to prevent C# errors
async function startChangeMonitoring(pool) {
  console.log('[Service Broker] Skipping trigger creation to prevent C# errors');
  // Trigger creation disabled to prevent C# application errors
}
```

## 📊 ผลลัพธ์ที่คาดหวัง

### ✅ หลังแก้ไข
- C# application ทำงานได้ปกติ
- ไม่มี error `Invalid object name 'inserted'`
- การ insert/update ข้อมูลทำงานได้
- Performance ดีขึ้น (ไม่มี trigger ที่ซับซ้อน)

### ⚠️ สิ่งที่เปลี่ยนแปลง
- ไม่มี real-time updates ผ่าน Service Broker
- ไม่มี trigger ที่ซับซ้อน
- การ update ข้อมูลจะใช้ polling แทน

## 🎯 ทางเลือกเพิ่มเติม

### Option 1: ใช้ Polling (แนะนำ)
```javascript
// ใช้ polling ทุก 30 วินาที แทน real-time updates
setInterval(async () => {
  // Check for changes
  const changes = await checkForChanges();
  if (changes.length > 0) {
    broadcast({ type: 'data_update', changes });
  }
}, 30000);
```

### Option 2: สร้าง Trigger อย่างง่าย (ถ้าต้องการ)
```sql
-- Trigger อย่างง่ายที่ไม่ใช้ dynamic SQL
CREATE TRIGGER [TR_IT_MachinesCurrent_Simple]
ON [mes].[dbo].[TBL_IT_MachinesCurrent]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Simple logging only
    DECLARE @changeType NVARCHAR(10);
    
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
        SET @changeType = 'UPDATE';
    ELSE IF EXISTS(SELECT * FROM inserted)
        SET @changeType = 'INSERT';
    ELSE
        SET @changeType = 'DELETE';
    
    -- Log to a simple table or just print
    PRINT 'Change: ' + @changeType;
END
```

## 🚀 ขั้นตอนการทดสอบ

1. **รัน SQL script** เพื่อลบ trigger
2. **Restart C# application**
3. **ทดสอบการ insert/update ข้อมูล**
4. **ตรวจสอบ logs** ว่าไม่มี error
5. **ทดสอบ performance** ว่าดีขึ้น

## 📞 หากยังมีปัญหา

1. **ตรวจสอบ SQL Server logs**
2. **ตรวจสอบ C# application logs**
3. **ยืนยันว่า trigger ถูกลบแล้ว**
4. **ตรวจสอบ database connection**

## 🎉 สรุป

**ปัญหาหลัก**: Trigger ที่ใช้ dynamic SQL ซับซ้อน
**การแก้ไข**: ลบ trigger ที่มีปัญหา
**ผลลัพธ์**: C# application ทำงานได้ปกติ
**Performance**: ดีขึ้นเนื่องจากไม่มี trigger ที่ซับซ้อน

**รัน `quick-fix-csharp.sql` ทันทีเพื่อแก้ไขปัญหา!** 🚀
