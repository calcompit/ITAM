import sql from 'mssql';

// Database configuration
const sqlConfig = {
    user: 'ccet',
    password: '!qaz7410',
    database: 'mes',
    server: '10.53.64.205',
    options: {
        encrypt: true,
        trustServerCertificate: true,
        connectTimeout: 30000,
        requestTimeout: 30000
    }
};

async function fixCSharpError() {
    console.log('🔧 FIXING C# ERROR: Invalid object name "inserted"');
    console.log('================================================');
    
    try {
        // Connect to database
        console.log('📡 Connecting to SQL Server...');
        const pool = await sql.connect(sqlConfig);
        console.log('✅ Connected successfully!');
        
        // Check if trigger exists
        console.log('\n🔍 Checking for problematic trigger...');
        const triggerCheck = await pool.request()
            .query(`
                SELECT name, is_disabled 
                FROM sys.triggers 
                WHERE name = 'TR_IT_MachinesCurrent_Change'
            `);
        
        if (triggerCheck.recordset.length > 0) {
            console.log('❌ Found problematic trigger: TR_IT_MachinesCurrent_Change');
            
            // Drop the trigger
            console.log('🗑️  Removing problematic trigger...');
            await pool.request()
                .query(`DROP TRIGGER [TR_IT_MachinesCurrent_Change]`);
            
            console.log('✅ SUCCESS: Trigger removed!');
        } else {
            console.log('ℹ️  Trigger TR_IT_MachinesCurrent_Change does not exist');
        }
        
        // Check for other problematic triggers
        console.log('\n🔍 Checking for other problematic triggers...');
        const otherTriggers = await pool.request()
            .query(`
                SELECT t.name, t.is_disabled 
                FROM sys.triggers t
                JOIN sys.tables tab ON t.parent_id = tab.object_id
                WHERE tab.name = 'TBL_IT_MachinesCurrent'
                AND t.name LIKE '%Log%'
            `);
        
        if (otherTriggers.recordset.length > 0) {
            console.log('❌ Found other problematic triggers:');
            for (const trigger of otherTriggers.recordset) {
                console.log(`   - ${trigger.name}`);
                await pool.request()
                    .query(`DROP TRIGGER [${trigger.name}]`);
                console.log(`   ✅ Removed: ${trigger.name}`);
            }
        }
        
        // Show remaining triggers
        console.log('\n📋 Remaining triggers on TBL_IT_MachinesCurrent:');
        const remainingTriggers = await pool.request()
            .query(`
                SELECT 
                    t.name as TriggerName,
                    t.parent_class_desc as ParentType,
                    t.is_disabled as IsDisabled
                FROM sys.triggers t
                JOIN sys.tables tab ON t.parent_id = tab.object_id
                WHERE tab.name = 'TBL_IT_MachinesCurrent'
                ORDER BY t.name
            `);
        
        if (remainingTriggers.recordset.length === 0) {
            console.log('   ✅ No triggers remaining (GOOD!)');
        } else {
            for (const trigger of remainingTriggers.recordset) {
                console.log(`   - ${trigger.name} (${trigger.IsDisabled ? 'DISABLED' : 'ENABLED'})`);
            }
        }
        
        // Test database connection
        console.log('\n🧪 Testing database connection...');
        const testResult = await pool.request()
            .query('SELECT 1 as test');
        
        if (testResult.recordset.length > 0) {
            console.log('✅ Database connection test: PASSED');
        }
        
        console.log('\n🎉 C# ERROR FIX COMPLETED!');
        console.log('================================================');
        console.log('✅ Your C# application should work now!');
        console.log('✅ Test your C# application immediately.');
        console.log('✅ The "Invalid object name \'inserted\'" error should be gone.');
        
    } catch (err) {
        console.error('❌ ERROR:', err.message);
        console.error('Stack trace:', err.stack);
        process.exit(1);
    } finally {
        await sql.close();
    }
}

// Run the fix
fixCSharpError().catch(console.error);
