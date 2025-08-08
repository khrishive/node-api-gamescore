import { db } from '../db.js';

export async function getMapStats(req, res) {
  const fixtureId = req.params.fixtureId;

  if (!fixtureId) {
    return res.status(400).json({ error: 'Missing fixtureId parameter' });
  }

  try {
    const [rows] = await db.query(
      `SELECT player_id, player_name, kills, deaths, assists, plus_minus, adr, headshot_percent 
       FROM map_team_players 
       WHERE fixture_id = ?`,
      [fixtureId]
    );

    const playerStats = {};

    for (const row of rows) {
      const {
        player_id,
        player_name,
        kills,
        deaths,
        assists,
        plus_minus,
        adr,
        headshot_percent,
      } = row;

      if (!playerStats[player_id]) {
        playerStats[player_id] = {
          player_id,
          player_name,
          total_kills: 0,
          total_deaths: 0,
          total_assists: 0,
          total_plus_minus: 0,
          adr_sum: 0,
          maps_played: 0,
          estimated_headshots: 0,
        };
      }

      const stats = playerStats[player_id];
      stats.total_kills += kills;
      stats.total_deaths += deaths;
      stats.total_assists += assists;
      stats.total_plus_minus += plus_minus;
      stats.adr_sum += adr;
      stats.maps_played += 1;

      const estimatedHs = kills * (headshot_percent / 100);
      stats.estimated_headshots += estimatedHs;
    }

    const result = Object.values(playerStats).map((stats) => {
      const avg_adr = stats.adr_sum / stats.maps_played;
      const hs_percent = stats.total_kills > 0
        ? (stats.estimated_headshots / stats.total_kills) * 100
        : 0;

      return {
        player_id: stats.player_id,
        player_name: stats.player_name,
        kills: stats.total_kills,
        deaths: stats.total_deaths,
        assists: stats.total_assists,
        plus_minus: stats.total_plus_minus,
        adr: parseFloat(avg_adr.toFixed(2)),
        headshot_percent: parseFloat(hs_percent.toFixed(4)),
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching map stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


export async function getMapRoundScores(req, res) {
  const { fixture_id } = req.query;

  if (!fixture_id) {
    return res.status(400).json({ error: 'fixture_id parameter is required' });
  }

  try {
    const [rows] = await db.query(
      `SELECT 
        id,
        fixture_id,
        map_number,
        map_name,
        team_id,
        rounds_won,
        half1_score,
        half2_score,
        created_at
       FROM map_team_round_scores
       WHERE fixture_id = ?`,
      [fixture_id]
    );

    res.json({ data: rows });
  } catch (error) {
    console.error('Error fetching map_team_round_scores:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
