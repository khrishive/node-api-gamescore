import { getDbBySport } from './src/utils/dbUtils.js';

async function checkPickBan() {
  const db = getDbBySport('dota2');
  
  console.log('=== DATOS EN dota2_pick_ban ===\n');
  
  const [rows] = await db.query(
    `SELECT * FROM dota2_pick_ban WHERE fixture_id = 979590 AND type = 'pick' ORDER BY map_number, team_id`,
    []
  );
  
  console.log(`Total de picks: ${rows.length}`);
  console.log(JSON.stringify(rows, null, 2));
  
  // Agrupar por mapa y equipo
  const grouped = {};
  rows.forEach(row => {
    const key = `Mapa ${row.map_number} - Team ${row.team_id}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row.hero_id);
  });
  
  console.log('\n=== PICKS AGRUPADOS ===');
  for (const [key, picks] of Object.entries(grouped)) {
    console.log(`${key}: ${picks.length} picks → [${picks.join(', ')}]`);
  }
  
  process.exit(0);
}

checkPickBan().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
