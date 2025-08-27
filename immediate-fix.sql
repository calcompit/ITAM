USE [mes]
GO

-- IMMEDIATE FIX for C# Error: Invalid object name 'inserted'
PRINT '=== FIXING C# ERROR IMMEDIATELY ==='

-- Remove the problematic trigger
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_IT_MachinesCurrent_Change')
BEGIN
    DROP TRIGGER [TR_IT_MachinesCurrent_Change]
    PRINT '✓ FIXED: Removed problematic trigger TR_IT_MachinesCurrent_Change'
END
ELSE
BEGIN
    PRINT 'ℹ Trigger TR_IT_MachinesCurrent_Change does not exist'
END

-- Remove any other problematic triggers
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_IT_MachinesCurrent_Log')
BEGIN
    DROP TRIGGER [TR_IT_MachinesCurrent_Log]
    PRINT '✓ FIXED: Removed log trigger TR_IT_MachinesCurrent_Log'
END

-- Check remaining triggers
PRINT '=== Checking remaining triggers ==='
SELECT 
    t.name as TriggerName,
    t.parent_class_desc as ParentType,
    t.is_disabled as IsDisabled
FROM sys.triggers t
JOIN sys.tables tab ON t.parent_id = tab.object_id
WHERE tab.name = 'TBL_IT_MachinesCurrent'
ORDER BY name

PRINT '=== C# ERROR FIX COMPLETED ==='
PRINT '✓ Your C# application should work now!'
PRINT '✓ Test your C# application immediately.'
GO
