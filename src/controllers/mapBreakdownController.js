import { dbCS2, dbLOL } from '../db.js';

// Helper to get the correct DB pool based on sport
function getDbBySport(sport = 'cs2') {
  if (sport === 'lol') return dbLOL;
  return dbCS2;
}

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
      `SELECT id, total_fixtures, competition_id 
       FROM team_stats 
       WHERE team_id = ?`,
      [teamId]
    );

    if (teamStats.length === 0) {
      return res.status(404).json({ error: 'No stats found for this team' });
    }

    // ⚠️ Aquí podrías devolver todos los torneos, no solo uno
    const response = [];
    for (const stat of teamStats) {
      const [breakdownRows] = await db.execute(
        `SELECT map_name AS map, played, wins AS w, losses AS l, win_pct 
         FROM team_stats_breakdown 
         WHERE team_stats_id = ?`,
        [stat.id]
      );

      response.push({
        competitionId: stat.competition_id,
        totalFixtures: stat.total_fixtures,
        breakdown: breakdownRows
      });
    }

    return res.json({
      teamId,
      competitions: response
    });

  } catch (error) {
    console.error('Error in mapBreakdownControllerNoTournament:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
