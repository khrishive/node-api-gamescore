import { getDbBySport } from './src/utils/dbUtils.js';

async function removeDuplicates() {
  const db = getDbBySport('dota2');
  
  console.log('🔍 Buscando duplicados en dota2_pick_ban...\n');
  
  try {
    // Eliminar duplicados manteniendo el registro más reciente (mayor id)
    const deleteQuery = `
      DELETE t1 FROM dota2_pick_ban t1
      INNER JOIN dota2_pick_ban t2 
      WHERE 
        t1.fixture_id = t2.fixture_id
        AND t1.map_number = t2.map_number
        AND t1.team_id = t2.team_id
        AND t1.hero_id = t2.hero_id
        AND t1.type = t2.type
        AND t1.\`order\` = t2.\`order\`
        AND t1.id < t2.id
    `;
    
    const [result] = await db.query(deleteQuery);
    
    console.log(`✅ Duplicados eliminados: ${result.affectedRows} filas\n`);
    
    // Verificar el resultado
    const [picks] = await db.query(
      `SELECT fixture_id, map_number, team_id, COUNT(*) as count 
       FROM dota2_pick_ban 
       WHERE fixture_id = 979590 AND type = 'pick'
       GROUP BY fixture_id, map_number, team_id
       ORDER BY map_number, team_id`
    );
    
    console.log('📊 Picks por equipo después de la limpieza:');
    picks.forEach(row => {
      console.log(`  Fixture ${row.fixture_id}, Mapa ${row.map_number}, Team ${row.team_id}: ${row.count} picks`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

removeDuplicates();
