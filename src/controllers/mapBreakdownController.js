import { getDbBySport } from '../utils/dbUtils.js';

export async function mapBreakdownController(req, res) {
  try {
    const teamId = parseInt(req.params.teamId, 10);
    const competitionId = parseInt(req.params.competitionId, 10);
    const sport = req.query.sport || 'cs2';
    const db = getDbBySport(sport);

    if (isNaN(teamId)) return res.status(400).json({ error: 'Invalid team ID' });
    if (isNaN(competitionId)) return res.status(400).json({ error: 'Invalid competition ID' });

    // ✅ Buscar stats del equipo en ese torneo
    const [teamStats] = await db.execute(
      `SELECT id, total_fixtures 
       FROM team_stats 
       WHERE team_id = ? AND competition_id = ? 
       LIMIT 1`,
      [teamId, competitionId]
    );

    if (teamStats.length === 0) {
      return res.status(404).json({ error: 'No stats found for this team/competition' });
    }

    const teamStatsId = teamStats[0].id;
    const totalFixtures = teamStats[0].total_fixtures;

    // ✅ Buscar breakdown asociado
    const [breakdownRows] = await db.execute(
      `SELECT map_name AS map, played, w, l, win_pct 
      FROM team_stats_breakdown 
      WHERE team_stats_id = ?`,
      [teamStatsId]
    );

    return res.json({
      teamId,
      competitionId,
      totalFixtures,
      breakdown: breakdownRows
    });

  } catch (error) {
    console.error('Error in mapBreakdownController:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function mapBreakdownControllerNoTournament(req, res) {
  try {
    const teamId = parseInt(req.params.teamId, 10);
    const sport = req.query.sport || 'cs2';
    const db = getDbBySport(sport);

    if (isNaN(teamId)) return res.status(400).json({ error: 'Invalid team ID' });

    // ✅ Buscar stats del equipo (sin torneo específico)
    const [teamStats] = await db.execute(
      `SELECT ts.id, ts.total_fixtures, ts.competition_id, tsb.map_name AS map, tsb.played, tsb.wins AS w, tsb.losses AS l, tsb.win_pct
       FROM team_stats ts
       LEFT JOIN team_stats_breakdown tsb ON ts.id = tsb.team_stats_id
       WHERE ts.team_id = ?`,
      [teamId]
    );

    if (teamStats.length === 0) {
      return res.status(404).json({ error: 'No stats found for this team' });
    }

    const competitions = {};
    teamStats.forEach(row => {
      if (!competitions[row.competition_id]) {
        competitions[row.competition_id] = {
          competitionId: row.competition_id,
          totalFixtures: row.total_fixtures,
          breakdown: []
        };
      }
      if (row.map) {
        competitions[row.competition_id].breakdown.push({
          map: row.map,
          played: row.played,
          w: row.w,
          l: row.l,
          win_pct: row.win_pct
        });
      }
    });

    return res.json({
      teamId,
      competitions: Object.values(competitions)
    });

  } catch (error) {
    console.error('Error in mapBreakdownControllerNoTournament:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
