import { getDbBySport } from './src/utils/dbUtils.js';

const INDEX_NAME = 'uq_dota2_pick_ban_event';

async function addUniqueIndex() {
  const db = getDbBySport('dota2');

  try {
    console.log('🔎 Verificando índice en dota2_pick_ban...');

    const [indexes] = await db.query('SHOW INDEX FROM dota2_pick_ban WHERE Key_name = ?', [INDEX_NAME]);

    if (indexes.length > 0) {
      console.log(`✅ El índice ${INDEX_NAME} ya existe.`);
      process.exit(0);
    }

    console.log('🛠️ Creando índice único uq_dota2_pick_ban_event...');

    await db.query(`
      ALTER TABLE dota2_pick_ban
      ADD UNIQUE KEY uq_dota2_pick_ban_event
      (fixture_id, map_number, \`order\`, team_id, hero_id, type)
    `);

    console.log('✅ Índice único creado correctamente.');
    process.exit(0);
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      console.error('❌ No se pudo crear el índice porque aún existen duplicados en la tabla.');
      console.error('💡 Ejecuta primero: node remove-pickban-duplicates.js');
      process.exit(1);
    }

    console.error('❌ Error al crear el índice único:', error.message);
    process.exit(1);
  }
}

addUniqueIndex();
