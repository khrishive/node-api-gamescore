import { getDbBySport } from '../utils/dbUtils.js';

// Devuelve los mapas jugados en un fixture
export async function getFixtureMaps(fixtureId, sport = 'cs2') {
  const db = getDbBySport(sport);

  const [maps] = await db.query(`
    SELECT 
      id,
      map_number,
      name,
      status
    FROM maps
    WHERE fixture_id = ?
    ORDER BY map_number ASC
  `, [fixtureId]);
  return { fixtureId, maps };
}