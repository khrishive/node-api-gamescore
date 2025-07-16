import { getMapBreakdownByTeam } from '../middleware/mapBrakDownDataProcess.js';

export async function mapBreakdownController(req, res) {
  try {
    const teamId = parseInt(req.params.teamId, 10);
    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    const breakdown = await getMapBreakdownByTeam(teamId);
    return res.json({ teamId, breakdown });
  } catch (error) {
    console.error('Error in mapBreakdownController:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
