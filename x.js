import {getDbBySport} from './src/utils/dbUtils.js';
import dotenv from 'dotenv';


dotenv.config();

const db = getDbBySport('lol');

/**
 * Obtiene todos los jugadores del mapa asociados a un fixture_id
 * @param {number} fixtureId - ID del fixture
 * @returns {Promise<Array<Object>>} - Array de objetos con los datos de map_team_players
 */
export async function getMapTeamPlayersByFixture(fixtureId) {
  let connection;

  try {
    connection = await mysql.createConnection(db);

    const [rows] = await connection.query(
      `SELECT * FROM map_team_players WHERE fixture_id = ?`,
      [fixtureId]
    );

    return rows; // Devuelve un array de objetos
  } catch (error) {
    console.error('❌ Error al obtener datos de map_team_players:', error.message);
    return [];
  } finally {
    if (connection) await connection.end();
  }
}
