import { getDbBySport } from "../utils/dbUtils.js";
import { saveOrUpdateMapBreakdown } from './saveOrUpdateMapBreakdown.js';

async function updateAllMapBreakdowns(sport = "cs2") {
  const db = getDbBySport(sport);
  // 🔍 Obtener todos los pares únicos (team, competition)
  const [rows] = await db.execute(`
    SELECT DISTINCT competition_id, participants0_id AS team_id
    FROM fixtures
    WHERE participants0_id IS NOT NULL
    UNION
    SELECT DISTINCT competition_id, participants1_id AS team_id
    FROM fixtures
    WHERE participants1_id IS NOT NULL
  `);

  console.log(`Encontrados ${rows.length} equipos-torneos únicos`);

  for (const row of rows) {
    const { team_id, competition_id } = row;

    try {
      console.log(`➡ Procesando team_id=${team_id}, competition_id=${competition_id}`);
      await saveOrUpdateMapBreakdown(team_id, competition_id, sport);
    } catch (err) {
      console.error(`❌ Error con team_id=${team_id}, competition_id=${competition_id}`, err.message);
    }
  }

  console.log(`✅ Actualización terminada para ${sport}`);
}

// Ejecutar con parámetro sport (ejemplo: node updateAllMapBreakdowns.js cs2)
const sport = process.argv[2] || "cs2";
updateAllMapBreakdowns(sport)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error global:', err);
    process.exit(1);
  });