import { db } from './db.js';

async function testConnection() {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    console.log('✅ Conexión exitosa. Resultado:', rows[0].result);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al conectar a MySQL:', err);
    process.exit(1);
  }
}

testConnection();