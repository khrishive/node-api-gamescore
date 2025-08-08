// src/inserts/insertMapTeamPlayers.js
import dotenv from 'dotenv';
import { db } from '../db.js';
import axios from 'axios';

dotenv.config();

const API_URL = process.env.GAME_SCORE_API;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

async function getFixtureIds() {
  const [rows] = await db.query('SELECT id FROM fixtures');
  return rows.map(row => row.id);
}

async function fetchMapTeamPlayers(fixtureId) {
  try {
    const response = await axios.get(`${API_URL}/fixtures/${fixtureId}`, {
      headers: {
        Authorization: AUTH_TOKEN
      }
    });

    const fixtureData = response.data;

    if (!fixtureData?.maps) return [];

    const result = [];

    for (const map of fixtureData.maps) {
      const mapNumber = map.mapNumber;

      for (const team of map.teamStats || []) {
        const teamId = team.teamId? team.teamId : 0;

        for (const player of team.players || []) {
          const kills = player.kills ?? 0;
          const deaths = player.deaths ?? 0;
          const headshots = player.headshots ?? 0;

          const plusMinus = kills - deaths;
          const headshotPercent = kills > 0 ? (headshots / kills) * 100 : 0;

          result.push([
            fixtureId,
            mapNumber,
            teamId,
            player.playerId,
            player.name,
            kills,
            deaths,
            player.assists ?? 0,
            plusMinus,
            player.adr ?? 0,
            headshotPercent,
          ]);
        }
      }
    }

    return result;

  } catch (error) {
    console.error(`[ERROR] Fixture ${fixtureId}:`, error.message);
    return [];
  }
}

async function insertMapTeamPlayers(data) {
  if (data.length === 0) return;

  const query = `
    INSERT INTO map_team_players (
      fixture_id, map_number, team_id, player_id, player_name,
      kills, deaths, assists, plus_minus, adr, headshot_percent
    ) VALUES ?
    ON DUPLICATE KEY UPDATE
      player_name = VALUES(player_name),
      kills = VALUES(kills),
      deaths = VALUES(deaths),
      assists = VALUES(assists),
      plus_minus = VALUES(plus_minus),
      adr = VALUES(adr),
      headshot_percent = VALUES(headshot_percent)
  `;

  try {
    await db.query(query, [data]);
    console.log(`[✓] Insertados ${data.length} registros`);
  } catch (err) {
    console.error(`[ERROR INSERT]`, err.message);
  }
}

async function main() {
  const fixtureIds = await getFixtureIds();

  for (const fixtureId of fixtureIds) {
    console.log(`Procesando fixture ${fixtureId}`);
    const data = await fetchMapTeamPlayers(fixtureId);
    await insertMapTeamPlayers(data);
  }

  console.log('✓ Proceso finalizado');
  process.exit();
}

main();
