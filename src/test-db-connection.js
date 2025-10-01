import { db } from './db.js';

async function testConnection() {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    console.log('✅ Successful connection. Result:', rows[0].result);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error connecting to MySQL:', err);
    process.exit(1);
  }
}

testConnection();