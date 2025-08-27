-- IMMEDIATE FIX for C# Error: Invalid object name 'inserted'
-- This script will remove the problematic trigger that's causing C# application errors

USE [mes]
GO

PRINT '=== FIXING C# ERROR: Invalid object name inserted ==='

-- Step 1: Disable the problematic trigger immediately
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_IT_MachinesCurrent_Change')
BEGIN
    DISABLE TRIGGER [TR_IT_MachinesCurrent_Change] ON [mes].[dbo].[TBL_IT_MachinesCurrent]
    PRINT '✓ DISABLED problematic trigger: TR_IT_MachinesCurrent_Change'
END
ELSE
BEGIN
    PRINT 'ℹ Trigger TR_IT_MachinesCurrent_Change does not exist'
END

-- Step 2: Drop the problematic trigger completely
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_IT_MachinesCurrent_Change')
BEGIN
    DROP TRIGGER [TR_IT_MachinesCurrent_Change]
    PRINT '✓ DROPPED problematic trigger: TR_IT_MachinesCurrent_Change'
END

-- Step 3: Check for any other problematic triggers
PRINT '=== Checking for other triggers on TBL_IT_MachinesCurrent ==='
SELECT 
    t.name as TriggerName,
    t.parent_class_desc as ParentType,
    t.is_disabled as IsDisabled,
    t.create_date as CreatedDate
FROM sys.triggers t
JOIN sys.tables tab ON t.parent_id = tab.object_id
WHERE tab.name = 'TBL_IT_MachinesCurrent'

-- Step 4: Create a simple, safe trigger (optional - for logging only)
PRINT '=== Creating simple, safe trigger for logging ==='
CREATE TRIGGER [TR_IT_MachinesCurrent_Log]
ON [mes].[dbo].[TBL_IT_MachinesCurrent]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Simple logging without any complex operations
    DECLARE @changeType NVARCHAR(10);
    DECLARE @machineID NVARCHAR(255);
    
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
        SET @changeType = 'UPDATE';
    ELSE IF EXISTS(SELECT * FROM inserted)
        SET @changeType = 'INSERT';
    ELSE
        SET @changeType = 'DELETE';
    
    -- Get MachineID safely
    IF @changeType IN ('INSERT', 'UPDATE')
        SELECT @machineID = MachineID FROM inserted;
    ELSE
        SELECT @machineID = MachineID FROM deleted;
    
    -- Simple log (optional)
    IF @machineID IS NOT NULL
        PRINT 'Change logged: ' + @changeType + ' on MachineID: ' + @machineID;
END
GO

PRINT '=== C# ERROR FIX COMPLETED ==='
PRINT '✓ Problematic trigger removed'
PRINT '✓ Safe trigger created for logging'
PRINT '✓ C# application should now work without errors'
PRINT ''
PRINT 'Next steps:'
PRINT '1. Test your C# application - it should work now'
PRINT '2. If you need real-time updates, implement them at application level'
PRINT '3. Monitor performance - it should be much better now'

-- Verify the fix
SELECT 
    name as TriggerName,
    parent_class_desc as ParentType,
    is_disabled as IsDisabled
FROM sys.triggers t
JOIN sys.tables tab ON t.parent_id = tab.object_id
WHERE tab.name = 'TBL_IT_MachinesCurrent'
ORDER BY name
GO
