import { dbCS2, dbLOL } from '../db.js';

// Helper to get the correct DB pool based on sport
function getDbBySport(sport = 'cs2') {
  if (sport === 'lol') return dbLOL;
  return dbCS2;
}

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