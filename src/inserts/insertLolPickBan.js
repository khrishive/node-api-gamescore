import dotenv from 'dotenv';
import axios from 'axios';
import { getDbBySport } from '../utils/dbUtils.js';

dotenv.config();

const API_URL = process.env.GAME_SCORE_API;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

async function getFixtureIds(db) {
  const sportAlias = 'lol';
  const [rows] = await db.query(
    `SELECT id FROM fixtures WHERE sport_alias = ?`,
    [sportAlias]
  );
  return rows.map(row => row.id);
}

async function fetchPickBanData(fixtureId) {
  try {
    const response = await axios.get(`${API_URL}/pickban/${fixtureId}/hero`, {
      headers: { Authorization: AUTH_TOKEN },
    });

    const data = response.data;
    if (!data?.pickBan || !Array.isArray(data.pickBan)) {
      return [];
    }

    // Convertimos cada entrada en un array listo para insertar en SQL
    const pickBan = data.pickBan.map(entry => [
      fixtureId,
      entry.mapNumber ?? 0,
      entry.order ?? 0,
      entry.teamId ?? 0,
      entry.heroId ?? 0,
      entry.type ?? '',
    ]);

    return pickBan;
  } catch (error) {
    console.error(`[ERROR] Fixture ${fixtureId}:`, error.message);
    return [];
  }
}

async function insertLolPickBan(db, pickBan) {
  try {
    if (pickBan.length === 0) return;

    const insertQuery = `
      INSERT INTO lol_pick_ban (
        fixture_id, map_number, \`order\`, team_id, hero_id, type
      )
      VALUES ?
      ON DUPLICATE KEY UPDATE
        team_id = VALUES(team_id),
        hero_id = VALUES(hero_id),
        type = VALUES(type)
    `;

    await db.query(insertQuery, [pickBan]);
    console.log(`[✓] Inserted ${pickBan.length} records into lol_pick_ban`);
  } catch (err) {
    console.error('[INSERT ERROR]', err.message);
  }
}

export async function processLolPickBan(sport = 'lol') {
  const db = getDbBySport(sport);
  const fixtureIds = await getFixtureIds(db);

  console.log(`Found ${fixtureIds.length} fixtures for ${sport} to process.`);

  for (const fixtureId of fixtureIds) {
    console.log(`Processing fixture ${fixtureId}`);
    const pickBan = await fetchPickBanData(fixtureId);
    await insertLolPickBan(db, pickBan);
  }

  console.log(`✓ Process finished for ${sport}`);
}

// Ejecutar directamente desde CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const sportArg = process.argv[2] || 'lol';
  processLolPickBan(sportArg).catch(err => {
    console.error('Error during direct execution:', err.message);
    process.exit(1);
  });
}
