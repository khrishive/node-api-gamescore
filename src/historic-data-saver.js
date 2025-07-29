import axios from 'axios';
import dotenv from 'dotenv';
import { db } from './db.js';
import { handleLiveEvent } from './inserts/live-data/index.js';
import mainLogger from './inserts/live-data/loggers/mainLoggers.js';

dotenv.config();

const TOKEN = process.env.GAME_SCORE_APIKEY;
const API_URL = 'https://api.gamescorekeeper.com/v2/live/historic/';

async function getAllFixtureIds() {
  const [rows] = await db.query('SELECT id FROM fixtures WHERE id IS NOT NULL');
  return rows.map(row => row.id);
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
      mainLogger.warn(`[API] No events found in API response for fixture ${fixtureId}`);
      return;
    }

    let context = {
      fixtureId,
      mapNumber: null,
      roundNumber: null,
    };

    for (const message of events) {
      try {
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

        mainLogger.debug(`[API] Procesando evento ${message.type} para fixture ${fixtureId}`);
        await handleLiveEvent(message, context);

      } catch (err) {
        mainLogger.error(`[API] Error procesando evento en fixture ${fixtureId}, snapshot ${message?.payload?.snapshotNumber}: ${err.message}\n${err.stack}`);
      }
    }

    mainLogger.info(`[API] Procesamiento completo para fixture ${fixtureId}`);

  } catch (err) {
    mainLogger.error(`[API] Error obteniendo datos de fixture ${fixtureId}: ${err.message}\n${err.stack}`);
  }
}

async function main() {
  const fixtureIds = await getAllFixtureIds();
  for (const fixtureId of fixtureIds) {
    await processFixtureFromAPI(fixtureId);
  }
}

main();
