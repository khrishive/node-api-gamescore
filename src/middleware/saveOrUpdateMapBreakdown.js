import { getDbBySport } from "../utils/dbUtils.js";
import { getMapBreakdownByTeam } from "./mapBreakdownDataProcess.js";

export async function saveOrUpdateMapBreakdown(teamId, competitionId, sport = "cs2") {
  try {
    const db = getDbBySport(sport);
    // 1️⃣ Get team breakdown
    const mapData = await getMapBreakdownByTeam(teamId, 100, competitionId);
    const { totalFixtures, breakdown } = mapData;

    // 2️⃣ Check if the teamId + competitionId combination already exists
    const [[existing]] = await db.execute(
      `SELECT id FROM team_stats WHERE team_id = ? AND competition_id = ?`,
      [teamId, competitionId]
    );

    let teamStatsId;

    if (existing) {
      // 🔄 Update
      teamStatsId = existing.id;
      await db.execute(
        `UPDATE team_stats 
         SET total_fixtures = ?, updated_at = NOW() 
         WHERE id = ?`,
        [totalFixtures, teamStatsId]
      );

      // 🔄 Delete old breakdown to re-insert
      await db.execute(
        `DELETE FROM team_stats_breakdown WHERE team_stats_id = ?`,
        [teamStatsId]
      );
    } else {
      // ➕ Insert new
      const [result] = await db.execute(
        `INSERT INTO team_stats (team_id, competition_id, total_fixtures)
         VALUES (?, ?, ?)`,
        [teamId, competitionId, totalFixtures]
      );
      teamStatsId = result.insertId;
    }

    // 3️⃣ Insert the breakdowns
    const insertValues = breakdown.map((b) => [
      teamStatsId,
      b.map,
      b.played,
      b.w,
      b.l,
      parseFloat(b.win_pct.replace("%", "")), // convert to number
    ]);

    if (insertValues.length > 0) {
      await db.query(
        `INSERT INTO team_stats_breakdown 
        (team_stats_id, map_name, played, w, l, win_pct) VALUES ?`,
        [insertValues]
      );
    }

    console.log(
      `✅ Map breakdown saved or updated for team ${teamId}, competition ${competitionId}`
    );
  } catch (err) {
    console.error("❌ Error saving/updating map breakdown:", err);
  }
}