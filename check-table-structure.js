import { getDbBySport } from './src/utils/dbUtils.js';

async function checkTableStructure() {
  const db = getDbBySport('dota2');
  
  console.log('📋 Estructura de la tabla dota2_pick_ban:\n');
  
  const [columns] = await db.query('DESCRIBE dota2_pick_ban');
  console.log('Columnas:');
  console.table(columns);
  
  const [indexes] = await db.query('SHOW INDEX FROM dota2_pick_ban');
  console.log('\nÍndices/Claves:');
  console.table(indexes);
  
  process.exit(0);
}

checkTableStructure().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
