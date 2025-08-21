import { db } from '../db.js';
import { saveOrUpdateMapBreakdown } from './saveOrUpdateMapBreakdown.js';

async function updateAllMapBreakdowns() {
  // 🔍 Buscar solo pares (team_id, competition_id) que FALTAN en team_stats
  const [rows] = await db.execute(`
    SELECT DISTINCT f.competition_id, f.participants0_id AS team_id
    FROM fixtures f
    LEFT JOIN team_stats ts
      ON ts.team_id = f.participants0_id
      AND ts.competition_id = f.competition_id
    WHERE f.participants0_id IS NOT NULL
      AND ts.id IS NULL

    UNION

    SELECT DISTINCT f.competition_id, f.participants1_id AS team_id
    FROM fixtures f
    LEFT JOIN team_stats ts
      ON ts.team_id = f.participants1_id
      AND ts.competition_id = f.competition_id
    WHERE f.participants1_id IS NOT NULL
      AND ts.id IS NULL
  `);

  console.log(`Encontrados ${rows.length} equipos-torneos pendientes de registrar`);

  for (const row of rows) {
    const { team_id, competition_id } = row;

    try {
      console.log(`➡ Procesando team_id=${team_id}, competition_id=${competition_id}`);
      await saveOrUpdateMapBreakdown(team_id, competition_id);
      console.log(`✅ Guardado/actualizado team_id=${team_id}, competition_id=${competition_id}`);
    } catch (err) {
      console.error(`❌ Error con team_id=${team_id}, competition_id=${competition_id}`, err.message);
    }
  }

  console.log('🎉 Proceso de actualización terminado');
}

// Ejecutar
updateAllMapBreakdowns()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error global:', err);
    process.exit(1);
  });
