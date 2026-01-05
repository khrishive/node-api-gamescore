// src/inserts/insertLolPickBan.js

import dotenv from 'dotenv';
import axios from 'axios';
import { getDbBySport } from '../utils/dbUtils.js';

dotenv.config();

const API_URL = process.env.GAME_SCORE_API;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

const PICK_BAN_TABLE_BY_SPORT = {
  lol: 'lol_pick_ban',
  dota2: 'dota2_pick_ban',
};


/**
 * Obtiene fixture IDs por deporte
 */
async function getFixtureIds(db, sport) {
  const [rows] = await db.query(
    `SELECT id FROM fixtures WHERE sport_alias = ?`,
    [sport]
  );
  return rows.map(row => row.id);
}

async function fetchPickBanData(fixtureId) {
  try {
    const response = await axios.get(
      `${API_URL}/pickban/${fixtureId}/hero`,
      { headers: { Authorization: AUTH_TOKEN } }
    );

    const data = response.data;
    if (!Array.isArray(data?.pickBan)) return [];

    return data.pickBan.map(entry => [
      fixtureId,
      entry.mapNumber ?? 0,
      entry.order ?? 0,
      entry.teamId ?? 0,
      entry.heroId ?? 0,
      entry.type ?? '',
    ]);
  } catch (error) {
    console.error(`[ERROR] Fixture ${fixtureId}:`, error.message);
    return [];
  }
}

async function insertPickBan(db, pickBan, sport) {
  if (!pickBan.length) return;

  const table = PICK_BAN_TABLE_BY_SPORT[sport];

  if (!table) {
    throw new Error(`Pick/Ban not supported for sport: ${sport}`);
  }

  const query = `
    INSERT INTO ${table} (
      fixture_id, map_number, \`order\`, team_id, hero_id, type
    )
    VALUES ?
    ON DUPLICATE KEY UPDATE
      team_id = VALUES(team_id),
      hero_id = VALUES(hero_id),
      type = VALUES(type)
  `;

  await db.query(query, [pickBan]);
}


export async function processLolPickBan(sport = 'lol', data) {
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
    console.log(`⚠️ No fixture IDs for ${sport}. Pick/Ban skipped.`);
    return;
  }

  console.log(`🎯 Pick/Ban processing ${fixtureIds.length} fixtures (${sport.toUpperCase()})`);

  for (const fixtureId of fixtureIds) {
    try {
      const pickBan = await fetchPickBanData(fixtureId);
      await insertPickBan(db, pickBan, sport);
    } catch (err) {
      console.error(`❌ Pick/Ban failed for fixture ${fixtureId}:`, err.message);
    }
  }

  console.log(`✓ Pick/Ban finished for ${sport.toUpperCase()}`);
}

