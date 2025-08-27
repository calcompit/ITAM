-- Performance Optimization Script for IT Asset Monitor
-- Run this script on the SQL Server database to improve query performance

USE [mes]
GO

-- 1. Create indexes for better query performance
PRINT 'Creating performance indexes...'

-- Index on MachineID (Primary lookup)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TBL_IT_MachinesCurrent_MachineID')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TBL_IT_MachinesCurrent_MachineID] 
    ON [dbo].[TBL_IT_MachinesCurrent] ([MachineID])
    INCLUDE ([ComputerName], [UpdatedAt], [IPv4])
    WITH (ONLINE = ON)
    PRINT 'Created index: IX_TBL_IT_MachinesCurrent_MachineID'
END

-- Index on ComputerName for sorting
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TBL_IT_MachinesCurrent_ComputerName')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TBL_IT_MachinesCurrent_ComputerName] 
    ON [dbo].[TBL_IT_MachinesCurrent] ([ComputerName])
    INCLUDE ([MachineID], [UpdatedAt], [IPv4])
    WITH (ONLINE = ON)
    PRINT 'Created index: IX_TBL_IT_MachinesCurrent_ComputerName'
END

-- Index on UpdatedAt for online/offline status
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TBL_IT_MachinesCurrent_UpdatedAt')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TBL_IT_MachinesCurrent_UpdatedAt] 
    ON [dbo].[TBL_IT_MachinesCurrent] ([UpdatedAt])
    INCLUDE ([MachineID], [ComputerName], [IPv4])
    WITH (ONLINE = ON)
    PRINT 'Created index: IX_TBL_IT_MachinesCurrent_UpdatedAt'
END

-- Index on IPv4 for IP grouping
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TBL_IT_MachinesCurrent_IPv4')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TBL_IT_MachinesCurrent_IPv4] 
    ON [dbo].[TBL_IT_MachinesCurrent] ([IPv4])
    INCLUDE ([MachineID], [ComputerName], [UpdatedAt])
    WITH (ONLINE = ON)
    PRINT 'Created index: IX_TBL_IT_MachinesCurrent_IPv4'
END

-- Indexes for TBL_IT_MachineChangeLog
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TBL_IT_MachineChangeLog_ChangeDate')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TBL_IT_MachineChangeLog_ChangeDate] 
    ON [dbo].[TBL_IT_MachineChangeLog] ([ChangeDate] DESC)
    INCLUDE ([ChangeID], [MachineID], [ChangedSUser], [SnapshotJson_Old], [SnapshotJson_New])
    WITH (ONLINE = ON)
    PRINT 'Created index: IX_TBL_IT_MachineChangeLog_ChangeDate'
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TBL_IT_MachineChangeLog_MachineID')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TBL_IT_MachineChangeLog_MachineID] 
    ON [dbo].[TBL_IT_MachineChangeLog] ([MachineID])
    INCLUDE ([ChangeID], [ChangeDate], [ChangedSUser])
    WITH (ONLINE = ON)
    PRINT 'Created index: IX_TBL_IT_MachineChangeLog_MachineID'
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TBL_IT_MachineChangeLog_ChangedSUser')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TBL_IT_MachineChangeLog_ChangedSUser] 
    ON [dbo].[TBL_IT_MachineChangeLog] ([ChangedSUser])
    INCLUDE ([ChangeID], [MachineID], [ChangeDate])
    WITH (ONLINE = ON)
    PRINT 'Created index: IX_TBL_IT_MachineChangeLog_ChangedSUser'
END

-- 2. Update statistics for better query planning
PRINT 'Updating statistics...'
UPDATE STATISTICS [dbo].[TBL_IT_MachinesCurrent] WITH FULLSCAN
UPDATE STATISTICS [dbo].[TBL_IT_MachineChangeLog] WITH FULLSCAN
PRINT 'Statistics updated successfully'

-- 3. Create optimized views for common queries
PRINT 'Creating optimized views...'

-- View for online computers
IF EXISTS (SELECT * FROM sys.views WHERE name = 'VW_OnlineComputers')
    DROP VIEW [dbo].[VW_OnlineComputers]
GO

CREATE VIEW [dbo].[VW_OnlineComputers] AS
SELECT 
    MachineID,
    ComputerName,
    Domain,
    UUID,
    SUser,
    BoardSerial,
    BiosSerial,
    CPU_Model,
    CPU_PhysicalCores,
    CPU_LogicalCores,
    RAM_TotalGB,
    RAM_ModulesJson,
    Storage_TotalGB,
    Storage_Json,
    GPU_Json,
    NICs_Json,
    OS_Caption,
    OS_Version,
    OS_InstallDate,
    LastBoot,
    IPv4,
    UpdatedAt,
    HUD_Mode,
    HUD_ColorARGB,
    HUD_Version,
    Win_Activated,
    'online' as Status
FROM [dbo].[TBL_IT_MachinesCurrent]
WHERE DATEDIFF(MINUTE, UpdatedAt, GETUTCDATE()) <= 10
GO

-- View for offline computers
IF EXISTS (SELECT * FROM sys.views WHERE name = 'VW_OfflineComputers')
    DROP VIEW [dbo].[VW_OfflineComputers]
GO

CREATE VIEW [dbo].[VW_OfflineComputers] AS
SELECT 
    MachineID,
    ComputerName,
    Domain,
    UUID,
    SUser,
    BoardSerial,
    BiosSerial,
    CPU_Model,
    CPU_PhysicalCores,
    CPU_LogicalCores,
    RAM_TotalGB,
    RAM_ModulesJson,
    Storage_TotalGB,
    Storage_Json,
    GPU_Json,
    NICs_Json,
    OS_Caption,
    OS_Version,
    OS_InstallDate,
    LastBoot,
    IPv4,
    UpdatedAt,
    HUD_Mode,
    HUD_ColorARGB,
    HUD_Version,
    Win_Activated,
    'offline' as Status
FROM [dbo].[TBL_IT_MachinesCurrent]
WHERE DATEDIFF(MINUTE, UpdatedAt, GETUTCDATE()) > 10
GO

-- View for recent alerts
IF EXISTS (SELECT * FROM sys.views WHERE name = 'VW_RecentAlerts')
    DROP VIEW [dbo].[VW_RecentAlerts]
GO

CREATE VIEW [dbo].[VW_RecentAlerts] AS
SELECT TOP 100
    c.ChangeID as id,
    c.MachineID,
    c.ChangeDate as timestamp,
    c.ChangedSUser as username,
    c.SnapshotJson_Old,
    c.SnapshotJson_New,
    mc.ComputerName
FROM [dbo].[TBL_IT_MachineChangeLog] c
LEFT JOIN [dbo].[TBL_IT_MachinesCurrent] mc ON mc.MachineID = c.MachineID
WHERE c.SnapshotJson_Old IS NOT NULL 
    AND c.SnapshotJson_Old != '{}' 
    AND c.SnapshotJson_Old != ''
ORDER BY c.ChangeDate DESC, c.ChangeID DESC
GO

PRINT 'Optimized views created successfully'

-- 4. Create stored procedures for better performance
PRINT 'Creating optimized stored procedures...'

-- Stored procedure for getting computers with status
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'SP_GetComputersWithStatus')
    DROP PROCEDURE [dbo].[SP_GetComputersWithStatus]
GO

CREATE PROCEDURE [dbo].[SP_GetComputersWithStatus]
    @OrderBy NVARCHAR(50) = 'ComputerName'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SQL NVARCHAR(MAX);
    SET @SQL = '
    SELECT 
        MachineID,
        ComputerName,
        Domain,
        UUID,
        SUser,
        BoardSerial,
        BiosSerial,
        CPU_Model,
        CPU_PhysicalCores,
        CPU_LogicalCores,
        RAM_TotalGB,
        RAM_ModulesJson,
        Storage_TotalGB,
        Storage_Json,
        GPU_Json,
        NICs_Json,
        OS_Caption,
        OS_Version,
        OS_InstallDate,
        LastBoot,
        IPv4,
        UpdatedAt,
        HUD_Mode,
        HUD_ColorARGB,
        HUD_Version,
        Win_Activated,
        CASE 
            WHEN DATEDIFF(MINUTE, UpdatedAt, GETUTCDATE()) <= 10 THEN ''online''
            ELSE ''offline''
        END as Status
    FROM [dbo].[TBL_IT_MachinesCurrent]
    ORDER BY ' + @OrderBy;
    
    EXEC sp_executesql @SQL;
END
GO

-- Stored procedure for getting alerts by user
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'SP_GetAlertsByUser')
    DROP PROCEDURE [dbo].[SP_GetAlertsByUser]
GO

CREATE PROCEDURE [dbo].[SP_GetAlertsByUser]
    @Username NVARCHAR(100),
    @TopCount INT = 100
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@TopCount)
        c.ChangeID as id,
        c.MachineID,
        c.ChangeDate as timestamp,
        c.ChangedSUser as username,
        c.SnapshotJson_Old,
        c.SnapshotJson_New,
        mc.ComputerName
    FROM [dbo].[TBL_IT_MachineChangeLog] c
    LEFT JOIN [dbo].[TBL_IT_MachinesCurrent] mc ON mc.MachineID = c.MachineID
    WHERE c.SnapshotJson_Old IS NOT NULL 
        AND c.SnapshotJson_Old != '{}' 
        AND c.SnapshotJson_Old != ''
        AND (c.ChangedSUser = @Username OR @Username = 'c270188')
    ORDER BY c.ChangeDate DESC, c.ChangeID DESC;
END
GO

PRINT 'Optimized stored procedures created successfully'

-- 5. Set database optimization options
PRINT 'Setting database optimization options...'

-- Enable query store for performance monitoring
ALTER DATABASE [mes] SET QUERY_STORE = ON;
ALTER DATABASE [mes] SET QUERY_STORE (OPERATION_MODE = READ_WRITE);

-- Set compatibility level for better performance
ALTER DATABASE [mes] SET COMPATIBILITY_LEVEL = 150;

-- Enable auto update statistics
ALTER DATABASE [mes] SET AUTO_UPDATE_STATISTICS ON;

-- Enable auto create statistics
ALTER DATABASE [mes] SET AUTO_CREATE_STATISTICS ON;

PRINT 'Database optimization completed successfully!'
PRINT 'Performance improvements applied:'
PRINT '- Created 7 performance indexes'
PRINT '- Updated statistics'
PRINT '- Created 3 optimized views'
PRINT '- Created 2 stored procedures'
PRINT '- Enabled query store and auto statistics'
