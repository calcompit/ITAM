-- สร้าง table สำหรับเก็บสถานะการอ่าน alerts
CREATE TABLE TBL_IT_AlertReadStatus (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    AlertID VARCHAR(50) NOT NULL,           -- ID ของ alert
    UserID VARCHAR(100) NOT NULL,           -- ผู้ใช้ที่อ่าน
    ReadDate DATETIME DEFAULT GETDATE(),    -- วันที่อ่าน
    MachineID VARCHAR(200),                 -- Machine ID (optional)
    CreatedAt DATETIME DEFAULT GETDATE(),
    
    -- Index สำหรับการค้นหา
    INDEX IX_AlertReadStatus_AlertID (AlertID),
    INDEX IX_AlertReadStatus_UserID (UserID),
    INDEX IX_AlertReadStatus_ReadDate (ReadDate),
    
    -- Unique constraint เพื่อป้องกันการอ่านซ้ำ
    CONSTRAINT UQ_AlertReadStatus_AlertUser UNIQUE (AlertID, UserID)
);

-- ตัวอย่างข้อมูล
INSERT INTO TBL_IT_AlertReadStatus (AlertID, UserID, MachineID) VALUES
('499', 'admin', '667BEC5FE935EB9D9925881AE8E27077F50368AB162FEF97C6ECCDF554D8B3A7'),
('498', 'admin', '04D187C938176B467A9FBE3628835566D03B9648D93FC57E63D08A2D1FEE3D9A');
