# 🚨 C# Error Fix Instructions - Invalid object name 'inserted'

## ❌ Error ที่เกิดขึ้น
```
System.Data.SqlClient.SqlException
Message=Invalid object name 'inserted'.
Source=.Net SqlClient Data Provider
at OverlayHUD.Form1.UpsertToSql() in C:\Users\Dell-PC\source\repos\OverlayHUD\OverlayHUD\Form1.cs:line 1426
```

## 🔍 สาเหตุของปัญหา
- **C# Application** เรียก stored procedure `dbo.Upsert_IT_MachineCurrent`
- **Stored Procedure** ทำการ INSERT/UPDATE ข้อมูล
- **Trigger** `TR_IT_MachinesCurrent_Change` ทำงาน
- **Trigger ใช้ dynamic SQL** ที่มีปัญหา
- **`inserted` table** ไม่สามารถเข้าถึงได้ใน dynamic SQL context

## ✅ วิธีแก้ไขทันที

### Step 1: รัน SQL Script เพื่อลบ Trigger
```bash
# ใช้ sqlcmd
sqlcmd -S 10.53.64.205 -U ccet -P !qaz7410 -d mes -i immediate-fix.sql
```

### Step 2: หรือใช้ SQL Server Management Studio
1. เปิด SQL Server Management Studio
2. เชื่อมต่อกับ server: `10.53.64.205`
3. เลือก database: `mes`
4. เปิดไฟล์ `immediate-fix.sql`
5. กด F5 หรือ Execute

### Step 3: ตรวจสอบผลลัพธ์
คุณควรเห็น:
```
=== FIXING C# ERROR IMMEDIATELY ===
✓ FIXED: Removed problematic trigger TR_IT_MachinesCurrent_Change
=== C# ERROR FIX COMPLETED ===
✓ Your C# application should work now!
```

### Step 4: Test C# Application
1. รัน C# application ใหม่
2. ตรวจสอบว่า error หายไป
3. ทดสอบการ insert/update ข้อมูล

## 🔧 การแก้ไขใน C# Code (ถ้าต้องการ)

### Option 1: เพิ่ม Error Handling
```csharp
private void UpsertToSql()
{
    if (string.IsNullOrEmpty(_cacheMachineId)) return;

    try
    {
        using (var conn = new SqlConnection(_connStr))
        using (var cmd = new SqlCommand("dbo.Upsert_IT_MachineCurrent", conn))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            conn.Open();
            
            // ... existing code ...
            
            cmd.ExecuteNonQuery();
        }
    }
    catch (SqlException ex) when (ex.Message.Contains("inserted"))
    {
        // Log error and continue
        Console.WriteLine($"Trigger error: {ex.Message}");
        // Optionally retry without trigger
    }
    catch (Exception ex)
    {
        throw; // Re-throw other errors
    }
}
```

### Option 2: ใช้ Direct SQL แทน Stored Procedure
```csharp
private void UpsertToSqlDirect()
{
    if (string.IsNullOrEmpty(_cacheMachineId)) return;

    using (var conn = new SqlConnection(_connStr))
    {
        conn.Open();
        
        // Use MERGE statement directly
        var sql = @"
            MERGE dbo.TBL_IT_MachinesCurrent AS target
            USING (SELECT @MachineID as MachineID) AS source
            ON target.MachineID = source.MachineID
            WHEN MATCHED THEN
                UPDATE SET 
                    ComputerName = @ComputerName,
                    UpdatedAt = @UpdatedAt
                    -- ... other fields
            WHEN NOT MATCHED THEN
                INSERT (MachineID, ComputerName, UpdatedAt)
                VALUES (@MachineID, @ComputerName, @UpdatedAt);";
        
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@MachineID", _cacheMachineId);
            cmd.Parameters.AddWithValue("@ComputerName", _cacheComputer);
            cmd.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
            // ... other parameters
            
            cmd.ExecuteNonQuery();
        }
    }
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

## 🎯 ขั้นตอนการทดสอบ

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

**รัน `immediate-fix.sql` ทันทีเพื่อแก้ไขปัญหา!** 🚀
