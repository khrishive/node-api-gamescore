import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';
import { db } from '../db.js'; // Reuse connection pool

dotenv.config();

// 🔐 API Configuration
const API_BASE_URL = "https://api.gamescorekeeper.com/v2/live/historic/";
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

// 🧠 Format values by type
function normalize(value, type) {
  if (value === null || value === undefined) {
    if (type === 'text') return 'TBD';
    if (type === 'number') return 0;
    if (type === 'timestamp') return 9999999999999;
  }
  return value;
}

// 🧠 Extract and normalize event fields
function extractEventData(payload, fixtureId, event) {
  const name = payload.name ?? null;
  const actor = payload.killer ?? payload.planter ?? payload.assister ?? payload.defuser ?? null;

  return {
    fixture_id: normalize(fixtureId, 'number'),
    snapshot_number: normalize(payload.snapshotNumber, 'number'),
    sort_index: normalize(event.sortIndex, 'number'),
    event_type: normalize(event.type, 'text'),
    name: normalize(name, 'text'),
    map_name: normalize(payload.mapName, 'text'),
    map_number: normalize(payload.mapNumber, 'number'),
    half_number: normalize(payload.halfNumber, 'number'),
    round_number: normalize(payload.roundNumber, 'number'),
    event_timestamp: normalize(payload.timestamp, 'timestamp'),

    actor_id: normalize(actor?.id, 'text'),
    actor_name: normalize(actor?.name, 'text'),
    actor_team_id: normalize(actor?.teamId, 'text'),
    actor_side: normalize(actor?.side, 'text'),

    victim_id: normalize(payload.victim?.id, 'text'),
    victim_name: normalize(payload.victim?.name, 'text'),
    victim_team_id: normalize(payload.victim?.teamId, 'text'),
    victim_side: normalize(payload.victim?.side, 'text'),

    weapon: normalize(payload.weapon, 'text'),
    kill_id: normalize(payload.killId, 'text'),
    headshot: normalize(payload.headshot, 'number'),
    penetrated: normalize(payload.penetrated, 'number'),
    no_scope: normalize(payload.noScope, 'number'),
    through_smoke: normalize(payload.throughSmoke, 'number'),
    while_blinded: normalize(payload.whileBlinded, 'number'),

    winner_team_id: normalize(payload.winnerId, 'text')
  };
}

async function fetchAndStoreFixtureEvents() {
  const now = new Date();

  //🟡 Yesterday 00:00:00
  const startOfYesterday = new Date(now);
  startOfYesterday.setDate(now.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);
  const startOfYesterdayUnix = startOfYesterday.getTime();

/**
 * // 🟢 Start of June 1, 2025 (00:00:00) in milliseconds
  const startOfJuneFirst = new Date();
  startOfJuneFirst.setFullYear(2025, 5, 1); // June (month 5 because it starts from 0)
  startOfJuneFirst.setHours(0, 0, 0, 0);
  const startOfYesterdayUnix = startOfJuneFirst.getTime();
 */


  // 🟢 Today 23:59:59
  const hoy = new Date(); // Make sure you have this line if it is not before
  const endOfToday = new Date(hoy);
  endOfToday.setHours(23, 59, 59, 999);
  const endOfTodayUnix = endOfToday.getTime();

  try {
    console.log(`🕒 Searching for fixtures between ${startOfYesterdayUnix} and ${endOfTodayUnix}...`);

    const [fixtures] = await db.query(
      "SELECT id FROM fixtures WHERE start_time BETWEEN ? AND ?",
      [startOfYesterdayUnix, endOfTodayUnix]
    );

    console.log(`🔍 Found ${fixtures.length} fixtures.`);

    let processedFixtures = 0;

    for (const fixture of fixtures) {
      const fixtureId = fixture.id;
      console.log(`🧩 Processing fixture ID: ${fixtureId}`);

      const [existing] = await db.query(
        "SELECT COUNT(*) AS total FROM cs_match_events WHERE fixture_id = ?",
        [fixtureId]
      );

      if (existing[0].total > 0) {
        console.log(`⏭️  Info already exists for fixture ${fixtureId}. Skipping.`);
        continue;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}${fixtureId}`, {
          headers: { Authorization: AUTH_TOKEN }
        });

        const events = response.data.events;

        if (!Array.isArray(events) || events.length === 0) {
          console.warn(`⚠️  Fixture ${fixtureId} has no events.`);
          continue;
        }

        let inserted = 0;

        for (const event of events) {
          const payload = event.payload ?? {};
          const valuesObj = extractEventData(payload, fixtureId, event);
          const insertValues = Object.values(valuesObj);

          if (insertValues.length !== 26) {
            console.error(`❌ Fixture ${fixtureId}: unexpected number of values (${insertValues.length})`);
            continue;
          }

          await db.query(
            `INSERT INTO cs_match_events (
              fixture_id, snapshot_number, sort_index, event_type, name,
              map_name, map_number, half_number, round_number, event_timestamp,
              actor_id, actor_name, actor_team_id, actor_side,
              victim_id, victim_name, victim_team_id, victim_side,
              weapon, kill_id, headshot, penetrated, no_scope,
              through_smoke, while_blinded, winner_team_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            insertValues
          );

          inserted++;
        }

        console.log(`✅ Fixture ${fixtureId} inserted with ${inserted} events.`);
        processedFixtures++;
      } catch (apiErr) {
        console.error(`❌ Error getting events for fixture ${fixtureId}:`, apiErr.response?.data || apiErr.message);
      }
    }

    console.log(`🎯 Process finished. Processed fixtures: ${processedFixtures} of ${fixtures.length}.`);
  } catch (err) {
    console.error('❌ General error:', err.message);
  } finally {
    await db.end();
    console.log('🔌 Connection closed.');
  }
}

fetchAndStoreFixtureEvents();