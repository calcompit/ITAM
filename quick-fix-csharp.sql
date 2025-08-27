-- QUICK FIX for C# Error - Run this immediately!
USE [mes]
GO

-- Remove the problematic trigger
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_IT_MachinesCurrent_Change')
BEGIN
    DROP TRIGGER [TR_IT_MachinesCurrent_Change]
    PRINT 'FIXED: Removed problematic trigger'
END

-- Remove any other problematic triggers
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_IT_MachinesCurrent_Log')
BEGIN
    DROP TRIGGER [TR_IT_MachinesCurrent_Log]
    PRINT 'FIXED: Removed log trigger'
END

PRINT 'C# ERROR SHOULD BE FIXED NOW!'
PRINT 'Test your C# application immediately.'
GO
