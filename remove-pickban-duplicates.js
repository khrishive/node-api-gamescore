import { getDbBySport } from './src/utils/dbUtils.js';

async function removeDuplicates() {
  const db = getDbBySport('dota2');
  
  console.log('🔍 Buscando duplicados en TODA la tabla dota2_pick_ban...\n');
  console.log('⏳ Esto puede tomar unos minutos...\n');
  
  try {
    // Primero, contar cuántos duplicados hay en total
    console.log('📊 Analizando duplicados...');
    
    const [duplicateCount] = await db.query(`
      SELECT COUNT(*) as total
      FROM (
        SELECT t1.id
        FROM dota2_pick_ban t1
        INNER JOIN dota2_pick_ban t2 ON
          t1.fixture_id = t2.fixture_id
          AND t1.map_number = t2.map_number
          AND t1.team_id = t2.team_id
          AND t1.hero_id = t2.hero_id
          AND t1.type = t2.type
          AND t1.\`order\` = t2.\`order\`
          AND t1.id < t2.id
        LIMIT 10000
      ) as temp
    `);
    
    console.log(`📋 Encontrados aproximadamente ${duplicateCount[0].total} registros duplicados\n`);
    
    if (duplicateCount[0].total === 0) {
      console.log('✅ No hay duplicados para eliminar\n');
      process.exit(0);
    }
    
    // Eliminar duplicados en lotes para evitar timeout
    console.log('🗑️  Eliminando duplicados en lotes...\n');
    
    let totalDeleted = 0;
    let batchNumber = 1;
    
    while (true) {
      console.log(`   Procesando lote ${batchNumber}...`);
      
      // Obtener un lote de IDs duplicados
      const [batchDuplicates] = await db.query(`
        SELECT t1.id
        FROM dota2_pick_ban t1
        INNER JOIN dota2_pick_ban t2 ON
          t1.fixture_id = t2.fixture_id
          AND t1.map_number = t2.map_number
          AND t1.team_id = t2.team_id
          AND t1.hero_id = t2.hero_id
          AND t1.type = t2.type
          AND t1.\`order\` = t2.\`order\`
          AND t1.id < t2.id
        LIMIT 5000
      `);
      
      if (batchDuplicates.length === 0) {
        console.log('\n✅ Todos los duplicados han sido eliminados\n');
        break;
      }
      
      const idsToDelete = batchDuplicates.map(row => row.id);
      
      const [result] = await db.query(
        `DELETE FROM dota2_pick_ban WHERE id IN (?)`,
        [idsToDelete]
      );
      
      totalDeleted += result.affectedRows;
      console.log(`   ✓ Lote ${batchNumber}: ${result.affectedRows} registros eliminados (Total: ${totalDeleted})`);
      
      batchNumber++;
    }
    
    console.log(`\n🎉 Total de duplicados eliminados: ${totalDeleted}\n`);
    
    // Mostrar estadísticas finales
    const [stats] = await db.query(`
      SELECT 
        COUNT(DISTINCT fixture_id) as total_fixtures,
        COUNT(*) as total_records
      FROM dota2_pick_ban
    `);
    
    console.log('📊 Estadísticas finales:');
    console.log(`   Total fixtures: ${stats[0].total_fixtures}`);
    console.log(`   Total registros: ${stats[0].total_records}`);
    
    // Verificar que no queden duplicados
    console.log('\n🔍 Verificando que no queden duplicados...');
    const [remaining] = await db.query(`
      SELECT COUNT(*) as count
      FROM (
        SELECT fixture_id, map_number, team_id, hero_id, type, \`order\`, COUNT(*) as cnt
        FROM dota2_pick_ban
        GROUP BY fixture_id, map_number, team_id, hero_id, type, \`order\`
        HAVING cnt > 1
        LIMIT 1
      ) as temp
    `);
    
    if (remaining[0].count === 0) {
      console.log('✅ No quedan duplicados en la tabla\n');
    } else {
      console.log('⚠️  Aún quedan algunos duplicados, vuelve a ejecutar el script\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

removeDuplicates();
