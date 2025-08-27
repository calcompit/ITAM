-- Fix Trigger Script for IT Asset Monitor
-- This script fixes the problematic trigger that causes C# application errors

USE [mes]
GO

-- Drop the problematic trigger if it exists
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_IT_MachinesCurrent_Change')
BEGIN
    DROP TRIGGER [TR_IT_MachinesCurrent_Change]
    PRINT 'Dropped existing problematic trigger: TR_IT_MachinesCurrent_Change'
END

-- Create a new, simplified trigger that won't cause errors
CREATE TRIGGER [TR_IT_MachinesCurrent_Change]
ON [mes].[dbo].[TBL_IT_MachinesCurrent]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- This is a simplified trigger that just logs changes
    -- without using complex dynamic SQL that can cause errors
    
    DECLARE @changeType NVARCHAR(10);
    DECLARE @machineID NVARCHAR(255);
    DECLARE @computerName NVARCHAR(255);
    
    -- Determine change type
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        SET @changeType = 'UPDATE';
        SELECT @machineID = MachineID, @computerName = ComputerName FROM inserted;
    END
    ELSE IF EXISTS(SELECT * FROM inserted)
    BEGIN
        SET @changeType = 'INSERT';
        SELECT @machineID = MachineID, @computerName = ComputerName FROM inserted;
    END
    ELSE
    BEGIN
        SET @changeType = 'DELETE';
        SELECT @machineID = MachineID, @computerName = ComputerName FROM deleted;
    END
    
    -- Log the change (optional - for debugging)
    IF @machineID IS NOT NULL
    BEGIN
        PRINT 'Change detected: ' + @changeType + ' on MachineID: ' + @machineID + ' (' + ISNULL(@computerName, 'Unknown') + ')';
    END
    
    -- Note: Service Broker functionality is disabled to prevent errors
    -- If you need real-time updates, implement them at the application level
END
GO

PRINT 'Fixed trigger created successfully!'
PRINT 'This trigger will no longer cause C# application errors.'
PRINT 'Service Broker functionality is disabled for stability.'

-- Verify the trigger was created
SELECT 
    name as TriggerName,
    parent_class_desc as ParentType,
    create_date as CreatedDate
FROM sys.triggers 
WHERE name = 'TR_IT_MachinesCurrent_Change'
GO
