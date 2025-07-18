import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// 🔌 Configuración de base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
};

// 🔐 Configuración de API
const API_BASE_URL = "https://api.gamescorekeeper.com/v2/live/historic/";
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

// 🧠 Extrae los campos estandarizados según el evento
function extractEventData(payload, fixtureId, event) {
  const name = payload.name ?? null;
  const actor = payload.killer ?? payload.planter ?? payload.assister ?? payload.defuser ?? null;

  return {
    fixture_id: fixtureId ?? null,
    snapshot_number: payload.snapshotNumber ?? null,
    sort_index: event.sortIndex ?? null,
    event_type: event.type ?? null,
    name: name ?? null,
    map_name: payload.mapName ?? null,
    map_number: payload.mapNumber ?? null,
    half_number: payload.halfNumber ?? null,
    round_number: payload.roundNumber ?? null,
    event_timestamp: payload.timestamp ?? null,

    actor_id: actor?.id ?? null,
    actor_name: actor?.name ?? null,
    actor_team_id: actor?.teamId ?? null,
    actor_side: actor?.side ?? null,

    victim_id: payload.victim?.id ?? null,
    victim_name: payload.victim?.name ?? null,
    victim_team_id: payload.victim?.teamId ?? null,
    victim_side: payload.victim?.side ?? null,

    weapon: payload.weapon ?? null,
    kill_id: payload.killId ?? null,
    headshot: payload.headshot ?? null,
    penetrated: payload.penetrated ?? null,
    no_scope: payload.noScope ?? null,
    through_smoke: payload.throughSmoke ?? null,
    while_blinded: payload.whileBlinded ?? null,

    winner_team_id: payload.winnerId ?? null
  };
}

async function fetchAndStoreFixtureEvents() {
  // Obtener la fecha de hoy
  const now = new Date();

  // 🟡 Inicio de ayer (00:00:00)
  const startOfYesterday = new Date(now);
  startOfYesterday.setDate(now.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);
  const startOfYesterdayUnix = Math.floor(startOfYesterday.getTime() / 1000);

  // 🟢 Final de hoy (23:59:59)
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const endOfTodayUnix = Math.floor(endOfToday.getTime() / 1000);

  //console.log('🔙 Inicio de ayer (Unix):', startOfYesterdayUnix);
  //console.log('⏳ Final de hoy  (Unix):', endOfTodayUnix);

  const mainConnection = await mysql.createConnection(dbConfig);

  try {
    const from = startOfYesterdayUnix; // 2025-01-01
    const to = endOfTodayUnix;   // 2025-12-31 23:59:59

    const [fixtures] = await mainConnection.query(
      "SELECT id FROM fixtures WHERE start_time BETWEEN ? AND ?",
      [from, to]
    );

    const connection = await mysql.createConnection(dbConfig);

    for (const fixture of fixtures) {
      const fixtureId = fixture.id;
      console.log(`🔍 Procesando fixture ${fixtureId}`);

      try {
        const [existing] = await connection.query(
          "SELECT COUNT(*) AS total FROM cs_match_events WHERE fixture_id = ?",
          [fixtureId]
        );

        if (existing[0].total > 0) {
          console.log(`⏩ Fixture ${fixtureId} ya procesado. Se omite.`);
          continue;
        }

        const response = await axios.get(`${API_BASE_URL}${fixtureId}`, {
          headers: { Authorization: AUTH_TOKEN }
        });

        const events = response.data.events;

        if (!Array.isArray(events) || events.length === 0) {
          console.warn(`⚠️ Fixture ${fixtureId} no tiene eventos válidos.`);
          continue;
        }

        for (const event of events) {
          const payload = event.payload ?? {};
          const valuesObj = extractEventData(payload, fixtureId, event);
          const insertValues = Object.values(valuesObj);

          if (insertValues.length !== 26) {
            console.error(`❌ Fixture ${fixtureId} - Cantidad inesperada de valores (${insertValues.length}):`, insertValues);
            continue;
          }

          await connection.query(
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
        }

        console.log(`✅ Fixture ${fixtureId} procesado con ${events.length} eventos.`);
      } catch (apiErr) {
        console.error(`❌ Error en fixture ${fixtureId}:`, apiErr.response?.data || apiErr.message);
      }
    }

    await connection.end();
  } catch (dbErr) {
    console.error('❌ Error al obtener fixtures:', dbErr.message);
  } finally {
    await mainConnection.end();
  }
}

fetchAndStoreFixtureEvents();
