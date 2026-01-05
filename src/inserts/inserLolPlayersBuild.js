//src/inserts/inserLolPlayersBuild.js

import dotenv from 'dotenv';
import axios from 'axios';
import { getDbBySport } from '../utils/dbUtils.js';

import {
  fetchDota2PlayersBuild,
  insertDota2PlayersBuild
} from './insertDota2PlayerBuild.js';

dotenv.config();

const API_URL = process.env.GAME_SCORE_API;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

/**
 * Fallback: obtener fixtures desde BD
 */
async function getFixtureIds(db, sport) {
  const [rows] = await db.query(
    `SELECT id FROM fixtures WHERE sport_alias = ?`,
    [sport]
  );
  return rows.map(r => r.id);
}

/* ============================
   LOL IMPLEMENTATION
   ============================ */

async function fetchLolPlayersBuild(fixtureId) {
  try {
    const response = await axios.get(
      `${API_URL}/fixtures/${fixtureId}/stats`,
      { headers: { Authorization: AUTH_TOKEN } }
    );

    const data = response.data;
    if (!Array.isArray(data?.maps)) {
      return { buildData: [] };
    }

    const buildData = [];

    for (const map of data.maps) {
      const mapNumber = map.mapNumber ?? 0;

      for (const team of map.teamStats || []) {
        const teamId = team.teamId ?? 0;

        for (const player of team.players || []) {
          const items = player.items || [];
          const runes = player.runes || [];

          buildData.push([
            fixtureId,
            mapNumber,
            teamId,
            player.name ?? 'Unknown',
            items[0] ?? null,
            items[1] ?? null,
            items[2] ?? null,
            items[3] ?? null,
            items[4] ?? null,
            items[5] ?? null,
            player.level ?? 0,
            runes[0] ?? null,
            runes[1] ?? null,
            runes[2] ?? null,
            runes[3] ?? null,
            runes[4] ?? null,
            runes[5] ?? null,
            runes[6] ?? null,
            runes[7] ?? null,
            runes[8] ?? null,
            player.trinket ?? null,
            player.playerId ?? null,
            player.position ?? null,
            player.championId ?? null,
            player.visionScore ?? 0,
            player.wardsKilled ?? 0,
            player.wardsPlaced ?? 0,
            player.summonerSpell1 ?? null,
            player.summonerSpell2 ?? null,
            player.summonerSpell1Id ?? null,
            player.summonerSpell2Id ?? null,
            player.controlWardsPurchased ?? 0
          ]);
        }
      }
    }

    return { buildData };
  } catch (error) {
    console.error(`[ERROR] Fixture ${fixtureId}:`, error.message);
    return { buildData: [] };
  }
}

async function insertLolPlayersBuild(db, { buildData }) {
  if (!buildData.length) return 0;

  const query = `
    INSERT INTO lol_players_build (
      fixture_id,
      map_number,
      team_id,
      name,
      player_item_0,
      player_item_1,
      player_item_2,
      player_item_3,
      player_item_4,
      player_item_5,
      player_level,
      player_runes0,
      player_runes1,
      player_runes2,
      player_runes3,
      player_runes4,
      player_runes5,
      player_runes6,
      player_runes7,
      player_runes8,
      player_trinket,
      player_playerId,
      player_position,
      player_championId,
      player_visionScore,
      player_wardsKilled,
      player_wardsPlaced,
      player_summonerSpell1,
      player_summonerSpell2,
      player_summonerSpell1Id,
      player_summonerSpell2Id,
      player_controlWardsPurchased
    )
    VALUES ?
    ON DUPLICATE KEY UPDATE
      team_id = VALUES(team_id),
      player_level = VALUES(player_level)
  `;

  await db.query(query, [buildData]);
  return buildData.length;
}

/* ============================
   ORQUESTADOR MULTI-SPORT
   ============================ */

export async function processLolPlayersBuild(sport = 'lol', data) {
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
    ? fetchDota2PlayersBuild
    : fetchLolPlayersBuild;

  const inserter = isDota2
    ? insertDota2PlayersBuild
    : insertLolPlayersBuild;

  const label = sport.toUpperCase();

  console.log(`🎯 Processing ${fixtureIds.length} ${label} fixtures`);

  for (const fixtureId of fixtureIds) {
    try {
      console.log(`⚙️ [${label}] Processing fixture ${fixtureId}...`);

      const buildData = await fetcher(fixtureId);
      const inserted = await inserter(db, buildData);

      console.log(`✅ Fixture ${fixtureId}: ${inserted} rows upserted`);
    } catch (err) {
      console.error(`❌ Fixture ${fixtureId} failed:`, err.message);
    }
  }

  console.log(`✓ Process finished for ${sport}`);
}

/**
 * CLI
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const sportArg = process.argv[2] || 'lol';
  processLolPlayersBuild(sportArg).catch(err => {
    console.error("❌ Error during direct execution:", err.message);
    process.exit(1);
  });
}
