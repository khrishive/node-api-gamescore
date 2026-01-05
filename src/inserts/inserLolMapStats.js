// src/inserts/inserLolMapStats.js

import dotenv from 'dotenv';
import axios from 'axios';
import { getDbBySport } from '../utils/dbUtils.js';
import {
  fetchDota2MapTeamPlayers,
  insertDota2MapTeamPlayers
} from './insertDota2MapStats.js';


dotenv.config();

const API_URL = process.env.GAME_SCORE_API;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;
const AXIOS_TIMEOUT = 15000;
const BATCH_SIZE = 3; // paralelismo controlado

async function safeInsert(inserter, db, data, retries = 3) {
  try {
    return await inserter(db, data);
  } catch (err) {
    if (
      err.message.includes('Deadlock') &&
      retries > 0
    ) {
      console.warn('🔁 Deadlock detected, retrying...');
      await new Promise(r => setTimeout(r, 300));
      return safeInsert(inserter, db, data, retries - 1);
    }
    throw err;
  }
}


/**
 * Fallback: obtener todos los fixture IDs desde BD
 */
export async function getFixtureIds(db, sport) {
  const [rows] = await db.query(
    `
      SELECT id 
      FROM fixtures 
      WHERE sport_alias = ?
    `,
    [sport]
  );

  return rows.map(row => row.id);
}


/**
 * Fetch + transform de mapas / jugadores por fixture
 */
async function fetchMapTeamPlayers(fixtureId) {
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
            player.goldSpent ?? 0,
            player.baronKills ?? 0,
            player.dragonKills ?? 0,
            player.championDamage ?? 0,
            player.towersDestroyed ?? 0,
            player.kills ?? 0,
            player.deaths ?? 0,
            player.assists ?? 0,
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
async function insertMapTeamPlayers(db, teamStatsResult) {
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
      goldSpent,
      baronKills,
      dragonKills,
      championDamage,
      towersDestroyed,
      kills,
      deaths,
      assists,
      duration,
      winner_id
    )
    VALUES ?
    ON DUPLICATE KEY UPDATE
      player_name = VALUES(player_name),
      side = VALUES(side),
      cs = VALUES(cs),
      gold = VALUES(gold),
      goldSpent = VALUES(goldSpent),
      baronKills = VALUES(baronKills),
      dragonKills = VALUES(dragonKills),
      championDamage = VALUES(championDamage),
      towersDestroyed = VALUES(towersDestroyed),
      kills = VALUES(kills),
      deaths = VALUES(deaths),
      assists = VALUES(assists),
      duration = VALUES(duration),
      winner_id = VALUES(winner_id),
      map_name = VALUES(map_name)
  `;

  await db.query(query, [teamStatsResult]);
  return teamStatsResult.length;
}

/**
 * Orquestador principal
 */
export async function processMapTeamPlayers(sport = 'lol', data) {
  const db = getDbBySport(sport);
  let fixtureIds = [];

  if (data && typeof data === 'object') {
    fixtureIds = Array.isArray(data[sport]) ? data[sport] : [];
  } else if (Array.isArray(data)) {
    fixtureIds = data;
  } else {
    fixtureIds = await getFixtureIds(db, sport);
  }

  if (!fixtureIds.length) {
    console.log(`⚠️ No fixture IDs found for ${sport}. Skipping.`);
    return;
  }

  // 🔀 Resolver estrategia por deporte
  const isDota2 = sport === 'dota2';

  const fetcher = isDota2
    ? fetchDota2MapTeamPlayers
    : fetchMapTeamPlayers;

  const inserter = isDota2
    ? insertDota2MapTeamPlayers
    : insertMapTeamPlayers;

  const label = sport.toUpperCase();

  console.log(`🎯 Processing ${fixtureIds.length} ${label} fixtures (batch size: ${BATCH_SIZE})`);

  const stats = {
    total: fixtureIds.length,
    withMaps: 0,
    withoutMaps: 0,
    insertedRows: 0,
    errors: 0
  };

  for (let i = 0; i < fixtureIds.length; i += BATCH_SIZE) {
    const batch = fixtureIds.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (fixtureId) => {
        try {
          console.log(`⚙️ [${label}] Processing fixture ${fixtureId}...`);

          const { teamStatsResult, hasMaps, error } =
            await fetcher(fixtureId);

          if (error) {
            stats.errors++;
            return;
          }

          if (!hasMaps) {
            stats.withoutMaps++;
            console.log(`ℹ️ Fixture ${fixtureId} has no maps. Skipped.`);
            return;
          }

          const inserted = await safeInsert(inserter, db, teamStatsResult);
          stats.withMaps++;
          stats.insertedRows += inserted;

          console.log(`✅ Fixture ${fixtureId}: ${inserted} rows upserted`);

        } catch (err) {
          stats.errors++;
          console.error(`❌ Fixture ${fixtureId} failed:`, err.message);
        }
      })
    );
  }

  console.log(`\n📊 ${label} Map/Team Players Summary`);
  console.log(`• Fixtures total     : ${stats.total}`);
  console.log(`• Fixtures with maps : ${stats.withMaps}`);
  console.log(`• Fixtures empty     : ${stats.withoutMaps}`);
  console.log(`• Rows inserted      : ${stats.insertedRows}`);
  console.log(`• Errors             : ${stats.errors}`);
  console.log(`✓ Process finished for ${sport}`);
}


/**
 * CLI execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const sportArg = process.argv[2] || 'lol';
  processMapTeamPlayers(sportArg).catch(err => {
    console.error("❌ Error during direct execution:", err.message);
    process.exit(1);
  });
}
