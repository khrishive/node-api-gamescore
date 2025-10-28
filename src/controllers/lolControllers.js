import { getDbBySport } from '../utils/dbUtils.js';

/**
 * Obtiene todos los jugadores del mapa asociados a un fixture_id (usando el pool de 'lol')
 * @param {number} fixtureId - ID del fixture
 * @returns {Promise<Array<Object>>} - Array de objetos con los datos de map_team_players
 */
export async function getMapResultsLol(fixtureId) {
  const db = getDbBySport('lol');
  const query = `SELECT * FROM map_team_players WHERE fixture_id = ?`;

  try {
    const [rows] = await db.query(query, [fixtureId]);
    return rows;
  } catch (error) {
    console.error(`❌ Error al obtener map_team_players para fixture ${fixtureId}:`, error.message);
    return [];
  }
}


export async function getPickBanLol(fixtureId) {
  const db = getDbBySport('lol');
  const query = `SELECT * FROM lol_pick_ban WHERE fixture_id = ?`;

  try {
    const [rows] = await db.query(query, [fixtureId]);
    return rows;
  } catch (error) {
    console.error(`❌ Error al obtener lol_pick_ban para fixture ${fixtureId}:`, error.message);
    return [];
  }
}

