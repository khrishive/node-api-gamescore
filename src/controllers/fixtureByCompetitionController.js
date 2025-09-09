import { dbCS2, dbLOL } from '../db.js';

// Helper to get the correct DB pool based on sport
function getDbBySport(sport = 'cs2') {
  if (sport === 'lol') return dbLOL;
  return dbCS2;
}

export const getFixturesByCompetition = async (req, res) => {
  const { competitionId } = req.params;
  const sport = req.query.sport || 'cs2';
  const db = getDbBySport(sport);

  if (!competitionId) {
    return res.status(400).json({ error: 'competitionId requerido' });
  }

  try {
    const query = `
      SELECT *
      FROM fixtures
      WHERE competition_id = ?
      ORDER BY STR_TO_DATE(start_time, '%d/%m/%Y %l:%i %p') ASC
    `;
    const [rows] = await db.query(query, [competitionId]);

    res.json(rows);
  } catch (error) {
    console.error('Error al consultar fixtures:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
