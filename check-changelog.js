const sql = require('mssql');

const config = {
  user: 'ccet',
  password: '!qaz7410',
  database: 'mes',
  server: '10.53.64.205',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

async function checkChangelog() {
  try {
    const pool = await sql.connect(config);
    
    const machineID = '667BEC5FE935EB9D9925881AE8E27077F50368AB162FEF97C6ECCDF554D8B3A7';
    
    // Check changelog count
    const countResult = await pool.request()
      .input('machineID', sql.VarChar, machineID)
      .query('SELECT COUNT(*) as count FROM mes.dbo.TBL_IT_MachineChangeLog WHERE MachineID = @machineID');
    
    console.log('Changelog records:', countResult.recordset[0].count);
    
    // Get sample changelog data
    const changelogResult = await pool.request()
      .input('machineID', sql.VarChar, machineID)
      .query(`
        SELECT TOP 3 ChangeID, MachineID, ChangeDate, ChangedSUser,
               LEFT(SnapshotJson_Old, 100) as SnapshotJson_Old_Preview,
               LEFT(SnapshotJson_New, 100) as SnapshotJson_New_Preview
        FROM mes.dbo.TBL_IT_MachineChangeLog
        WHERE MachineID = @machineID
        ORDER BY ChangeDate DESC
      `);
    
    console.log('Sample changelog data:', changelogResult.recordset);
    
    await sql.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkChangelog();
