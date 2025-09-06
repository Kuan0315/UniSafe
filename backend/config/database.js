import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();


const sequelize = new Sequelize('unisave_db', 'root', 'Yuyu2004@#', {
  host: "127.0.0.1"||"localhost",   // or "localhost"
  dialect: "mysql",
  logging: false,
  logging: console.log, // Shows SQL queries in console
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error);
  }
}

// Add this function
export async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error);
    return false;
  }
}

// Then you can import it as:
// import { connectDB, sequelize } from './config/database.js';

testConnection();

export { sequelize };
