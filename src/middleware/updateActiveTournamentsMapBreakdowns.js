import { getDbBySport } from "../utils/dbUtils.js";
import { saveOrUpdateMapBreakdown } from "./saveOrUpdateMapBreakdown.js";

async function updateActiveMapBreakdowns(sport = "cs2") {
  const db = getDbBySport(sport);

  // 🔍 Obtener todos los pares únicos (team, competition) SOLO de torneos activos
  const [rows] = await db.execute(`
    SELECT DISTINCT f.competition_id, f.participants0_id AS team_id
    FROM fixtures f
    JOIN competitions c ON f.competition_id = c.id
    WHERE f.participants0_id IS NOT NULL
      AND c.start_date <= UNIX_TIMESTAMP(NOW()) * 1000
      AND (c.end_date + 86400000) >= UNIX_TIMESTAMP(NOW()) * 1000
    UNION
    SELECT DISTINCT f.competition_id, f.participants1_id AS team_id
    FROM fixtures f
    JOIN competitions c ON f.competition_id = c.id
    WHERE f.participants1_id IS NOT NULL
      AND c.start_date <= UNIX_TIMESTAMP(NOW()) * 1000
      AND (c.end_date + 86400000) >= UNIX_TIMESTAMP(NOW()) * 1000
  `);

  console.log(
    `Encontrados ${rows.length} equipos-torneos únicos en competiciones ACTIVAS`
  );

  for (const row of rows) {
    const { team_id, competition_id } = row;

    try {
      console.log(
        `➡ Procesando team_id=${team_id}, competition_id=${competition_id}`
      );
      await saveOrUpdateMapBreakdown(team_id, competition_id, sport);
    } catch (err) {
      console.error(
        `❌ Error con team_id=${team_id}, competition_id=${competition_id}`,
        err.message
      );
    }
  }

  console.log(
    `✅ Actualización terminada SOLO para torneos activos en la base de datos de ${sport}`
  );
}

// Ejecutar con parámetro sport (ejemplo: node updateActiveTournamentsMapBreakdowns.js cs2)
const sport = process.argv[2] || "cs2";
updateActiveMapBreakdowns(sport)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error global:", err);
    process.exit(1);
  });
