import axios from 'axios';
import dotenv from 'dotenv';
import { db } from './db.js';
import { handleLiveEvent } from './inserts/live-data/index.js';
import mainLogger from './inserts/live-data/loggers/mainLoggers.js';

dotenv.config();

const TOKEN = process.env.GAME_SCORE_APIKEY;
const API_URL = 'https://api.gamescorekeeper.com/v2/live/historic/';

async function getAllFixtureIds() {
  const [rows] = await db.query('SELECT fixture_id FROM fixtures WHERE fixture_id IS NOT NULL');
  return rows.map(row => row.fixture_id);
}

async function processFixtureFromAPI(fixtureId) {
  try {
    const response = await axios.get(`${API_URL}${fixtureId}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      timeout: 15000,
    });

    const events = response.data.events;

    if (!Array.isArray(events)) {
      mainLogger.warn({ msg: 'No events found in API response', fixtureId });
      return;
    }

    // Crear contexto inicial
    let context = {
      fixtureId: fixtureId,
      mapNumber: null,
      roundNumber: null,
    };

    for (const message of events) {
      try {
        // Actualiza contexto
        if (message.type === 'occurrence' && message.payload) {
          const name = message.payload.name;
          if (name === 'map_started') {
            context.mapNumber = message.payload.mapNumber || null;
            context.roundNumber = null;
          }
          if (name === 'round_started') {
            context.roundNumber = message.payload.roundNumber || null;
          }
        }

        mainLogger.debug({ msg: '[API] Procesando evento', fixtureId, eventType: message.type });
        await handleLiveEvent(message, context);

      } catch (err) {
        mainLogger.error({
          msg: '[API] Error procesando evento',
          error: err.message,
          stack: err.stack,
          fixtureId,
          snapshotNumber: message?.payload?.snapshotNumber,
        });
      }
    }

    mainLogger.info({ msg: '[API] Procesamiento completo', fixtureId });

  } catch (err) {
    mainLogger.error({
      msg: '[API] Error obteniendo datos de fixture',
      fixtureId,
      error: err.message,
    });
  }
}

async function main() {
  const fixtureIds = await getAllFixtureIds();
  for (const fixtureId of fixtureIds) {
    await processFixtureFromAPI(fixtureId);
  }
}

main();
