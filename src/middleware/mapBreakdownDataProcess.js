import { getDbBySport } from "../utils/dbUtils.js";

export async function getMapBreakdownByTeam(
  teamId,
  batchSize = 100,
  competitionId = null,
  sport = "cs2"
) {
  const db = getDbBySport(sport);
  const teamIdNum = parseInt(teamId, 10);
  const batch = parseInt(batchSize, 10);
  const competitionIdNum = parseInt(competitionId, 10);

  if (isNaN(teamIdNum)) throw new Error("Invalid teamId provided");
  if (isNaN(competitionIdNum))
    throw new Error("Invalid competitionId provided");

  const safeBatchSize = !isNaN(batch) && batch > 0 ? batch : 100;
  if (isNaN(safeBatchSize)) throw new Error("Invalid batch size");

  // ✅ Get total fixtures of the team in the specific competition
  const [[{ total }]] = await db.execute(
    `SELECT COUNT(*) AS total
     FROM fixtures
     WHERE competition_id = ?
       AND (participants0_id = ? OR participants1_id = ?)`,
    [competitionIdNum, teamIdNum, teamIdNum]
  );

  const mapStats = {};

  // ✅ Loop in batches also filtering by competition_id
  for (let offset = 0; offset < total; offset += safeBatchSize) {
    const [fixtures] = await db.execute(
      `SELECT id, winner_id
       FROM fixtures
       WHERE competition_id = ?
         AND (participants0_id = ? OR participants1_id = ?)
       ORDER BY start_time DESC
       LIMIT ${safeBatchSize} OFFSET ${offset}`,
      [competitionIdNum, teamIdNum, teamIdNum]
    );

    for (const fixture of fixtures) {
      const fixtureId = fixture.id;
      const winnerId = fixture.winner_id;

      // 👇 Get maps that were played in the fixture
      const [maps] = await db.execute(
        `SELECT DISTINCT map_number, map_name
         FROM cs_match_events
         WHERE fixture_id = ?
           AND name = 'map_started'
           AND map_name IS NOT NULL`,
        [fixtureId]
      );

      for (const map of maps) {
        const { map_number, map_name } = map;

        // 👇 Check if the team participated in that map
        const [participation] = await db.execute(
          `SELECT 1 FROM cs_match_events
           WHERE fixture_id = ?
             AND map_number = ?
             AND (actor_team_id = ? OR victim_team_id = ?)
           LIMIT 1`,
          [fixtureId, map_number, String(teamIdNum), String(teamIdNum)]
        );

        if (participation.length === 0) continue;

        // 👇 Initialize stats structure if it does not exist
        if (!mapStats[map_name]) {
          mapStats[map_name] = { played: 0, wins: 0, losses: 0 };
        }

        mapStats[map_name].played += 1;

        if (String(winnerId) === String(teamIdNum)) {
          mapStats[map_name].wins += 1;
        } else if (winnerId !== null) {
          mapStats[map_name].losses += 1;
        }
      }
    }
  }

  // ✅ Convert stats to array with win percentage
  const breakdown = Object.entries(mapStats).map(([map, stats]) => {
    const { played, wins, losses } = stats;
    const winPct =
      wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(2) : "0.00";
    return {
      map,
      played,
      w: wins,
      l: losses,
      win_pct: winPct + "%",
    };
  });

  return {
    totalFixtures: total,
    breakdown,
  };
}