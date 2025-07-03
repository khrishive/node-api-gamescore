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

async function fetchAndStoreFixtureEvents() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    const [fixtures] = await connection.query("SELECT id FROM fixtures");

    for (const fixture of fixtures) {
      const fixtureId = fixture.id;
      console.log(`🔍 Procesando fixture ${fixtureId}`);

      try {
        // 🛰️ Llamada a la API
        const response = await axios.get(`${API_BASE_URL}${fixtureId}`, {
          headers: {
            Authorization: AUTH_TOKEN
          }
        });

        const events = response.data.events;

        if (!Array.isArray(events)) {
          console.warn(`⚠️ Fixture ${fixtureId} no tiene eventos válidos.`);
          continue;
        }

          for (const event of events) {
              const payload = event.payload || {};

              // Extraer campos relevantes
              const values = {
                  fixture_id: fixtureId,
                  snapshot_number: payload.snapshotNumber || null,
                  sort_index: event.sortIndex || null,
                  event_type: event.type || null,
                  name: payload.name || null,
                  map_number: payload.mapNumber || null,
                  half_number: payload.halfNumber || null,
                  round_number: payload.roundNumber || null,
                  team_id: payload.teamId || null,
                  player_id: payload.playerId || null,
                  side: payload.side || null,
                  weapon: payload.weapon || null,
                  headshot: payload.headshot || null,
                  penetrated: payload.penetrated || null,
                  no_scope: payload.noScope || null,
                  through_smoke: payload.throughSmoke || null,
                  while_blinded: payload.whileBlinded || null,
                  event_timestamp: payload.timestamp || null

              };

              
              // Insertar evento en la base de datos
              await connection.query(
                `INSERT INTO cs_match_events (
                    fixture_id,
                    snapshot_number,
                    sort_index,
                    event_type,
                    name,
                    map_number,
                    half_number,
                    round_number,
                    team_id,
                    player_id,
                    side,
                    weapon,
                    headshot,
                    penetrated,
                    no_scope,
                    through_smoke,
                    while_blinded,
                    event_timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    values.fixture_id,
                    values.snapshot_number,
                    values.sort_index,
                    values.event_type,
                    values.name,
                    values.map_number,
                    values.half_number,
                    values.round_number,
                    values.team_id,
                    values.player_id,
                    values.side,
                    values.weapon,
                    values.headshot,
                    values.penetrated,
                    values.no_scope,
                    values.through_smoke,
                    values.while_blinded,
                    values.event_timestamp
                ]
                );



          }

        console.log(`✅ Eventos del fixture ${fixtureId} insertados correctamente.`);
      } catch (apiErr) {
        console.error(`❌ Error con fixture ${fixtureId}:`, apiErr.response?.data || apiErr.message);
      }
    }
  } catch (dbErr) {
    console.error('❌ Error en la base de datos:', dbErr.message);
  } finally {
    await connection.end();
  }
}

fetchAndStoreFixtureEvents();
