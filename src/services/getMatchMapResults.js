import { db } from '../db.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = "https://api.gamescorekeeper.com/v1/";
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

export async function getMatchMapResults(fixtureId) {
  // 1. Obtener pick/ban desde la API
  const pickRes = await axios.get(`${API_BASE_URL}pickban/${fixtureId}/maps`, {
    headers: { Authorization: AUTH_TOKEN }
  });

  const pickBanList = pickRes.data?.pickBan || [];

  // Crear diccionario: { "de_mirage": teamId }
  const pickMap = {};
  for (const item of pickBanList) {
    if (item.pickOrBan.toLowerCase() === 'pick') {
      // Aseguramos que esté en formato de base de datos (ej: de_mirage)
      const normalized = 'de_' + item.mapName.toLowerCase();
      pickMap[normalized] = item.teamId;
    }
  }

  // 2. Traer datos desde MySQL
    const [rows] = await db.query(`
    SELECT map_number, MAX(map_name) AS map_name, winner_team_id, COUNT(*) as rounds_won
    FROM cs_match_events
    WHERE fixture_id = ?
        AND name = 'round_ended'
        AND winner_team_id IS NOT NULL
    GROUP BY map_number, winner_team_id
    ORDER BY map_number ASC
    `, [fixtureId]);


  // 3. Agrupar resultados
  const mapResults = {};

  for (const row of rows) {
    const { map_number, map_name, winner_team_id } = row;

    if (!mapResults[map_number]) {
      mapResults[map_number] = {
        map_number,
        map_name,
        pick_team_id: pickMap[map_name] ?? null,
        team_0: { id: null, score: 0 },
        team_1: { id: null, score: 0 },
        team_ids: []
      };
    }

    const entry = mapResults[map_number];

    if (!entry.team_0.id) {
      entry.team_0.id = winner_team_id;
      entry.team_0.score = row.rounds_won;
      entry.team_ids.push(winner_team_id);
    } else if (entry.team_0.id === winner_team_id) {
      entry.team_0.score = row.rounds_won;
    } else {
      entry.team_1.id = winner_team_id;
      entry.team_1.score = row.rounds_won;
      entry.team_ids.push(winner_team_id);
    }
  }

  return Object.values(mapResults).map(({ team_ids, ...rest }) => rest);
}
