import { db } from '../db.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = "https://api.gamescorekeeper.com/v1/";
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

/**
 * Obtiene la información de rondas ganadas por mapa en un fixture
 */
export async function getMatchMapResults(fixtureId) {
  // 1. Traer pick/ban de API
  const pickRes = await axios.get(`${API_BASE_URL}pickban/${fixtureId}/maps`, {
    headers: { Authorization: AUTH_TOKEN }
  });

  const pickBanList = pickRes.data?.pickBan || [];

  // Crear diccionario de picks: { "Mirage": teamId }
  const pickMap = {};
  for (const item of pickBanList) {
    if (item.pickOrBan.toLowerCase() === 'pick') {
      pickMap[item.mapName.toLowerCase()] = item.teamId;
    }
  }

  // 2. Traer rondas por mapa desde MySQL
  const [rows] = await db.query(`
    SELECT map_number, map_name, winner_team_id, COUNT(*) as rounds_won
    FROM cs_match_events
    WHERE fixture_id = ?
      AND name = 'round_ended'
      AND winner_team_id IS NOT NULL
    GROUP BY map_number, winner_team_id
    ORDER BY map_number ASC
  `, [fixtureId]);

  // 3. Agrupar datos
  const mapResults = {};

  for (const row of rows) {
    const mapNum = row.map_number;
    const mapName = row.map_name;
    const teamId = row.winner_team_id;

    if (!mapResults[mapNum]) {
      mapResults[mapNum] = {
        map_number: mapNum,
        map_name: mapName,
        pick_team_id: pickMap[mapName?.toLowerCase()] ?? null,
        team_0: { id: null, score: 0 },
        team_1: { id: null, score: 0 },
        team_ids: []
      };
    }

    // Asignar equipos (0 y 1) de forma ordenada por aparición
    const entry = mapResults[mapNum];
    if (!entry.team_0.id) {
      entry.team_0.id = teamId;
      entry.team_0.score = row.rounds_won;
      entry.team_ids.push(teamId);
    } else if (entry.team_0.id === teamId) {
      entry.team_0.score = row.rounds_won;
    } else {
      entry.team_1.id = teamId;
      entry.team_1.score = row.rounds_won;
      entry.team_ids.push(teamId);
    }
  }

  // 4. Resultado final
  return Object.values(mapResults).map(({ team_ids, ...rest }) => rest);
}
