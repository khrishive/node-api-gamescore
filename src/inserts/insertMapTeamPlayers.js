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

    if (!fixtureData?.maps) return { teamStatsResult: [], teamRoundScores: [] };

    const teamStatsResult = [];
    const teamRoundScores = [];

    for (const map of fixtureData.maps) {
      const mapNumber = map.mapNumber;
      const mapName = map.mapName;

      for (const team of map.teamStats || []) {
        const teamId = team.teamId ?? 0;

        for (const player of team.players || []) {
          const kills = player.kills ?? 0;
          const deaths = player.deaths ?? 0;
          const headshots = player.headshots ?? 0;

          const plusMinus = kills - deaths;
          const headshotPercent = kills > 0 ? (headshots / kills) * 100 : 0;

          teamStatsResult.push([
            fixtureId,
            mapNumber,
            mapName,                // <- FALTA ESTE
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

      for (const team of map.roundScores || []) {
        const teamId = team.id ?? 0;
        const roundsWon = team.roundsWon ?? 0;
        const half1 = team.halfScores?.[0] ?? 0;
        const half2 = team.halfScores?.[1] ?? 0;

        teamRoundScores.push([
          fixtureId,
          mapNumber,
          mapName,                // <- FALTA ESTE
          teamId,
          roundsWon,
          half1,
          half2
        ]);
      }
    }

    return {
      teamStatsResult,
      teamRoundScores
    };

  } catch (error) {
    console.error(`[ERROR] Fixture ${fixtureId}:`, error.message);
    return { teamStatsResult: [], teamRoundScores: [] };
  }
}

async function insertMapTeamPlayers({ teamStatsResult, teamRoundScores }) {
  try {
    // Insert map_team_players
    if (teamStatsResult.length > 0) {
      const playerQuery = `
        INSERT INTO map_team_players (
          fixture_id, map_number, map_name, team_id, player_id, player_name,
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

      await db.query(playerQuery, [teamStatsResult]);
      console.log(`[✓] Insertados ${teamStatsResult.length} registros en map_team_players`);
    }

    // Insert map_team_round_scores
    if (teamRoundScores.length > 0) {
      const roundQuery = `
        INSERT INTO map_team_round_scores (
          fixture_id, map_number, map_name, team_id, rounds_won, half1_score, half2_score
        ) VALUES ?
        ON DUPLICATE KEY UPDATE
          rounds_won = VALUES(rounds_won),
          half1_score = VALUES(half1_score),
          half2_score = VALUES(half2_score)
      `;

      await db.query(roundQuery, [teamRoundScores]);
      console.log(`[✓] Insertados ${teamRoundScores.length} registros en map_team_round_scores`);
    }

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
