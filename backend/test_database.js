const mysql = require('mysql2/promise');

// Database connection
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Yuyu2004@#', // Your password
  database: 'unisave_db'
};

// Test function
async function testDatabase() {
  let connection;
  
  try {
    // 1. Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database');

    // 2. Test users table
    const [users] = await connection.execute('SELECT COUNT(*) AS count FROM users');
    console.log(`✅ Users table has ${users[0].count} records`);

    // 3. Test sos_alerts table
    const [alerts] = await connection.execute('SELECT COUNT(*) AS count FROM sos_alerts');
    console.log(`✅ SOS Alerts table has ${alerts[0].count} records`);

    // 4. Run specific test queries
    const [testResults] = await connection.execute(`
      SELECT u.name, COUNT(a.id) AS alert_count 
      FROM users u 
      LEFT JOIN sos_alerts a ON u.id = a.user_id 
      GROUP BY u.name
    `);
    
    console.log('✅ User alert counts:');
    testResults.forEach(row => {
      console.log(`   ${row.name}: ${row.alert_count} alerts`);
    });

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

// Run the test
testDatabase();