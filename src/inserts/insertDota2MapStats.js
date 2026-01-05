//src/inserts/insertDota2MapStats.js

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_URL = process.env.GAME_SCORE_API;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;
const AXIOS_TIMEOUT = 15000;
//const BATCH_SIZE = 3; // paralelismo controlado




export async function fetchDota2MapTeamPlayers(fixtureId) {
  try {
    const response = await axios.get(`${API_URL}/fixtures/${fixtureId}`, {
      headers: { Authorization: AUTH_TOKEN },
      timeout: AXIOS_TIMEOUT
    });

    const fixtureData = response.data;

    if (!Array.isArray(fixtureData?.maps) || fixtureData.maps.length === 0) {
      return { teamStatsResult: [], hasMaps: false };
    }

    const teamStatsResult = [];

    for (const map of fixtureData.maps) {
      const mapNumber = map.mapNumber ?? 0;
      const mapName = map.mapName ?? 'Unknown';
      const duration = map.duration ?? 0;
      const winnerId = map.winnerId ?? null;

      for (const team of map.teamStats || []) {
        const teamId = team.teamId ?? 0;
        const side = team.side ?? null;

        for (const player of team.players || []) {
          teamStatsResult.push([
            fixtureId,
            mapNumber,
            mapName,
            teamId,
            player.playerId,
            player.name ?? 'Unknown',
            side,
            player.cs ?? 0,
            player.gold ?? 0,
            player.heroDamage ?? 0,
            player.towersDestroyed ?? 0,
            player.kills ?? 0,
            player.deaths ?? 0,
            player.denies ?? 0,
            duration,
            winnerId
          ]);
        }
      }
    }

    return { teamStatsResult, hasMaps: true };

  } catch (error) {
    console.error(`[ERROR] Fixture ${fixtureId}:`, error.message);
    return { teamStatsResult: [], hasMaps: false, error: true };
  }
}

/**
 * Inserción masiva con UPSERT
 */
export async function insertDota2MapTeamPlayers(db, teamStatsResult) {
  if (!teamStatsResult.length) return 0;

  const query = `
    INSERT INTO map_team_players (
      fixture_id,
      map_number,
      map_name,
      team_id,
      player_id,
      player_name,
      side,
      cs,
      gold,
      heroDamage,
      towersDestroyed,
      kills,
      deaths,
      denies,
      duration,
      winner_id
    )
    VALUES ?
    ON DUPLICATE KEY UPDATE
      player_name = VALUES(player_name),
      side = VALUES(side),
      cs = VALUES(cs),
      gold = VALUES(gold),
      heroDamage = VALUES(heroDamage),
      towersDestroyed = VALUES(towersDestroyed),
      kills = VALUES(kills),
      deaths = VALUES(deaths),
      denies = VALUES(denies),
      duration = VALUES(duration),
      winner_id = VALUES(winner_id),
      map_name = VALUES(map_name)
  `;

  await db.query(query, [teamStatsResult]);
  return teamStatsResult.length;
}