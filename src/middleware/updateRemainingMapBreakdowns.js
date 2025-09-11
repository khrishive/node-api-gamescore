import { getDbBySport } from "../utils/dbUtils.js";
import { saveOrUpdateMapBreakdown } from './saveOrUpdateMapBreakdown.js';

async function updateRemainingMapBreakdowns(sport = "cs2") {
  const db = getDbBySport(sport);
  // 🔍 Search only for pairs (team_id, competition_id) that are MISSING in team_stats
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

  console.log(`Found ${rows.length} team-tournaments pending registration`);

  for (const row of rows) {
    const { team_id, competition_id } = row;

    try {
      console.log(`➡ Processing team_id=${team_id}, competition_id=${competition_id}`);
      await saveOrUpdateMapBreakdown(team_id, competition_id, sport);
      console.log(`✅ Saved/updated team_id=${team_id}, competition_id=${competition_id}`);
    } catch (err) {
      console.error(`❌ Error with team_id=${team_id}, competition_id=${competition_id}`, err.message);
    }
  }

  console.log(`🎉 Update process finished for ${sport}`);
}

// Execute
const sport = process.argv[2] || "cs2";
updateRemainingMapBreakdowns(sport)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Global error:', err);
    process.exit(1);
  });