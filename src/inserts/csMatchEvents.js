import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// 🔌 Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
};

// 🔐 API Configuration
const API_BASE_URL = "https://api.gamescorekeeper.com/v2/live/historic/";
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

// 🧠 Extracts standardized fields according to the event
function extractEventData(payload, fixtureId, event) {
  const name = payload.name || null;
  const actor = payload.killer || payload.planter || payload.assister || payload.defuser || null;

  return {
    fixture_id: fixtureId,
    snapshot_number: payload.snapshotNumber || null,
    sort_index: event.sortIndex || null,
    event_type: event.type || null,
    name: name,
    map_name: payload.mapName || null,
    map_number: payload.mapNumber || null,
    half_number: payload.halfNumber || null,
    round_number: payload.roundNumber || null,
    event_timestamp: payload.timestamp || null,

    actor_id: actor?.id || null,
    actor_name: actor?.name || null,
    actor_team_id: actor?.teamId || null,
    actor_side: actor?.side || null,

    victim_id: payload.victim?.id || null,
    victim_name: payload.victim?.name || null,
    victim_team_id: payload.victim?.teamId || null,
    victim_side: payload.victim?.side || null,

    weapon: payload.weapon || null,
    kill_id: payload.killId || null,
    headshot: payload.headshot || null,
    penetrated: payload.penetrated || null,
    no_scope: payload.noScope || null,
    through_smoke: payload.throughSmoke || null,
    while_blinded: payload.whileBlinded || null,

    winner_team_id: payload.winnerId || null // 🆕 new field added
  };
}

async function fetchAndStoreFixtureEvents() {
  const mainConnection = await mysql.createConnection(dbConfig);

  try {
    const from = 1735689600000; // 2025-01-01
    const to = 1767225599000;   // 2025-12-31 23:59:59

    const [fixtures] = await mainConnection.query(
      "SELECT id FROM fixtures WHERE start_time BETWEEN ? AND ?",
      [from, to]
    );

    for (const fixture of fixtures) {
      const fixtureId = fixture.id;
      console.log(`🔍 Processing fixture ${fixtureId}`);

      const connection = await mysql.createConnection(dbConfig);

      try {
        // Validate if it was already registered
        const [existing] = await connection.query(
          "SELECT COUNT(*) AS total FROM cs_match_events WHERE fixture_id = ?",
          [fixtureId]
        );

        if (existing[0].total > 0) {
          console.log(`⏩ Fixture ${fixtureId} already processed. Skipping.`);
          await connection.end();
          continue;
        }

        // 📡 API Call
        const response = await axios.get(`${API_BASE_URL}${fixtureId}`, {
          headers: { Authorization: AUTH_TOKEN }
        });

        const events = response.data.events;

        if (!Array.isArray(events) || events.length === 0) {
          console.warn(`⚠️ Fixture ${fixtureId} has no valid events.`);
          await connection.end();
          continue;
        }

        // 🔁 Insert events
        for (const event of events) {
          const payload = event.payload || {};
          const values = extractEventData(payload, fixtureId, event);

          await connection.query(
            `INSERT INTO cs_match_events (
              fixture_id, snapshot_number, sort_index, event_type, name,
              map_name, map_number, half_number, round_number, event_timestamp,
              actor_id, actor_name, actor_team_id, actor_side,
              victim_id, victim_name, victim_team_id, victim_side,
              weapon, kill_id, headshot, penetrated, no_scope,
              through_smoke, while_blinded, winner_team_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            Object.values(values)
          );
        }

        console.log(`✅ Fixture ${fixtureId} processed with ${events.length} events.`);
      } catch (apiErr) {
        console.error(`❌ Error in fixture ${fixtureId}:`, apiErr.response?.data || apiErr.message);
      } finally {
        await connection.end();
      }
    }

  } catch (dbErr) {
    console.error('❌ Error getting fixtures:', dbErr.message);
  } finally {
    await mainConnection.end();
  }
}



fetchAndStoreFixtureEvents();