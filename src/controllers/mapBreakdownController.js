import { getMapBreakdownByTeam } from '../middleware/mapBreakdownDataProcess.js';
import { getMapBreakdownByTeamNoTournament } from '../middleware/mapBreakdownDataProcessNoTournament.js';

export async function mapBreakdownController(req, res) {
  try {
    const teamId = parseInt(req.params.teamId, 10);
    const competitionId = parseInt(req.params.competitionId, 10);

    if (isNaN(teamId)) return res.status(400).json({ error: 'Invalid team ID' });
    if (isNaN(competitionId)) return res.status(400).json({ error: 'Invalid competition ID' });

    const result = await getMapBreakdownByTeam(teamId, 100, competitionId); // ahora pasamos competitionId

    return res.json({
      teamId,
      competitionId,
      totalFixtures: result.totalFixtures,
      breakdown: result.breakdown
    });
  } catch (error) {
    console.error('Error in mapBreakdownController:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function mapBreakdownControllerNoTournament(req, res) {
  try {
    const teamId = parseInt(req.params.teamId, 10);

    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    const result = await getMapBreakdownByTeamNoTournament(teamId, 100, null);

    return res.json({
      teamId,
      totalFixtures: result.totalFixtures,
      breakdown: result.breakdown
    });
  } catch (error) {
    console.error('Error in mapBreakdownControllerNoTournament:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 