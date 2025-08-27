-- เพิ่มข้อมูลทดสอบ alerts ใหม่
INSERT INTO TBL_IT_MachineChangeLog (MachineID, ChangeDate, ChangedSUser, SnapshotJson_Old, SnapshotJson_New) 
VALUES 
('TEST-MACHINE-001', GETDATE(), 'TEST_USER', '{"ComputerName":"TEST-PC-OLD","IPv4":"192.168.1.100"}', '{"ComputerName":"TEST-PC-NEW","IPv4":"192.168.1.101"}'),
('TEST-MACHINE-002', GETDATE(), 'ADMIN_USER', '{"RAM_TotalGB":"8","Storage_TotalGB":"500"}', '{"RAM_TotalGB":"16","Storage_TotalGB":"1000"}'),
('TEST-MACHINE-003', GETDATE(), 'SYSTEM', '{"NICs_Json":"[{\"name\":\"Ethernet\",\"mac\":\"00:11:22:33:44:55\"}]"}', '{"NICs_Json":"[{\"name\":\"Ethernet\",\"mac\":\"00:11:22:33:44:55\"},{\"name\":\"WiFi\",\"mac\":\"AA:BB:CC:DD:EE:FF\"}]"}');
