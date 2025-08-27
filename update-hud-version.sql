-- Update HUD_Version for some computers to test the dynamic trigger
-- This will trigger the Service Broker and send real-time updates

-- Update first computer
UPDATE [mes].[dbo].[TBL_IT_MachinesCurrent]
SET HUD_Version = '1.2.3',
    UpdatedAt = GETUTCDATE()
WHERE MachineID = '2C553E564A59A552D82F5930B2212347378173DB424F4520CD60B08B59DC219A';

-- Update second computer
UPDATE [mes].[dbo].[TBL_IT_MachinesCurrent]
SET HUD_Version = '2.0.1',
    UpdatedAt = GETUTCDATE()
WHERE MachineID = 'A9A59558A8062A23CC425F097A3D234374F8734AE67123F2998E768DF8FD6B7B';

-- Update third computer
UPDATE [mes].[dbo].[TBL_IT_MachinesCurrent]
SET HUD_Version = '1.5.0',
    UpdatedAt = GETUTCDATE()
WHERE MachineID = '4D295BD9B573D8DABCE1C0D8EB3044374FCFFE1E46F7BA099F6509697080D550';

-- Update a few more computers with different versions
UPDATE [mes].[dbo].[TBL_IT_MachinesCurrent]
SET HUD_Version = '2.1.0',
    UpdatedAt = GETUTCDATE()
WHERE MachineID = '288A7F3D156BE006C2250C7DFB901A740C9EBAFD7AF9A8AB8DA2AE11E5AE21D1';

UPDATE [mes].[dbo].[TBL_IT_MachinesCurrent]
SET HUD_Version = '1.8.2',
    UpdatedAt = GETUTCDATE()
WHERE MachineID = 'AEF413D40420EDE58113A347BCA5346BEBCF2EDDAA7A01441DB7983102F39A77';

-- Show the updated results
SELECT MachineID, ComputerName, HUD_Version, UpdatedAt
FROM [mes].[dbo].[TBL_IT_MachinesCurrent]
WHERE HUD_Version IS NOT NULL
ORDER BY UpdatedAt DESC;
