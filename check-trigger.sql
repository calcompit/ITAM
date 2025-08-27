-- Check Existing Trigger Script
-- This script checks the current trigger that's causing C# application errors

USE [mes]
GO

-- Check if the trigger exists
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_IT_MachinesCurrent_Change')
BEGIN
    PRINT 'Trigger exists: TR_IT_MachinesCurrent_Change'
    
    -- Get trigger definition
    SELECT 
        t.name as TriggerName,
        t.parent_class_desc as ParentType,
        t.create_date as CreatedDate,
        t.modify_date as ModifiedDate,
        OBJECT_DEFINITION(t.object_id) as TriggerDefinition
    FROM sys.triggers t
    WHERE t.name = 'TR_IT_MachinesCurrent_Change'
    
    PRINT 'Trigger definition retrieved above'
END
ELSE
BEGIN
    PRINT 'Trigger does not exist: TR_IT_MachinesCurrent_Change'
END

-- Check for any other triggers on the same table
PRINT 'All triggers on TBL_IT_MachinesCurrent:'
SELECT 
    t.name as TriggerName,
    t.parent_class_desc as ParentType,
    t.create_date as CreatedDate,
    t.is_disabled as IsDisabled
FROM sys.triggers t
JOIN sys.tables tab ON t.parent_id = tab.object_id
WHERE tab.name = 'TBL_IT_MachinesCurrent'

-- Check table structure
PRINT 'Table structure for TBL_IT_MachinesCurrent:'
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'TBL_IT_MachinesCurrent'
ORDER BY ORDINAL_POSITION

-- Check for Service Broker objects
PRINT 'Service Broker objects:'
SELECT 
    name as ObjectName,
    type_desc as ObjectType,
    create_date as CreatedDate
FROM sys.objects
WHERE name LIKE '%ITAsset%' OR name LIKE '%Change%'
ORDER BY type_desc, name

GO
