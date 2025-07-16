import {db} from '../db.js';

export async function getMapBreakdownByTeam(teamId) {
  const [fixtures] = await db.execute(
    `SELECT id, winner_id FROM fixtures
     WHERE participants0_id = ? OR participants1_id = ?`,
    [teamId, teamId]
  );

  const mapStats = {};

  for (const fixture of fixtures) {
    const fixtureId = fixture.id;
    const winnerId = fixture.winner_id;

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

      const [participation] = await db.execute(
        `SELECT 1 FROM cs_match_events
         WHERE fixture_id = ?
           AND map_number = ?
           AND (actor_team_id = ? OR victim_team_id = ?)
         LIMIT 1`,
        [fixtureId, map_number, String(teamId), String(teamId)]
      );

      if (participation.length === 0) continue;

      if (!mapStats[map_name]) {
        mapStats[map_name] = { played: 0, wins: 0, losses: 0 };
      }

      mapStats[map_name].played += 1;

      if (String(winnerId) === String(teamId)) {
        mapStats[map_name].wins += 1;
      } else if (winnerId !== null) {
        mapStats[map_name].losses += 1;
      }
    }
  }

  return Object.entries(mapStats).map(([map, stats]) => {
    const { played, wins, losses } = stats;
    const winPct = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(2) : '0.00';
    return {
      map,
      played,
      w: wins,
      l: losses,
      win_pct: winPct + '%'
    };
  });
}
