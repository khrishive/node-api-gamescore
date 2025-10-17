import dotenv from 'dotenv';
import axios from 'axios';
import { connectWebSocket } from './live-data-updater.js';

dotenv.config();

const API_KEY = process.env.GAME_SCORE_APIKEY;
const API_URL = process.env.GAME_SCORE_API;

const trackedFixtures = new Set(); // Fixture IDs for which WebSocket has already been opened

// 🔄 Changed to 15 minutes
const POLL_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

async function fetchStartedFixtures() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const sports = ['cs2', 'lol']; // 🎮 Agregamos los deportes que queremos monitorear

  try {
    const allFixtures = [];

    // 🔁 Hacemos una petición por cada deporte
    for (const sport of sports) {
      const API = `${API_URL}/fixtures?status=started&from=${dateStr}&sport=${sport}&to=${dateStr}`;
      const response = await axios.get(API, {
        headers: {
          Authorization: `Bearer ${API_KEY}`
        }
      });

      const fixtures = response.data.fixtures || [];
      console.log(`[MONITOR] [${dateStr}] Started fixtures found for ${sport}: ${fixtures.length}`);
      allFixtures.push(...fixtures);
    }

    console.log(`[MONITOR] Total started fixtures found: ${allFixtures.length}`);

    // 🚀 Procesamos todos los fixtures combinados
    for (const fixture of allFixtures) {
      const fixtureId = fixture.id;

      if (!trackedFixtures.has(fixtureId)) {
        console.log(`[MONITOR] Started fixture detected: ${fixtureId} - Connecting...`);
        connectWebSocket(fixtureId);
        trackedFixtures.add(fixtureId);
      }
    }
  } catch (error) {
    console.error('[MONITOR] Error getting fixtures:', error.message);
  }
}

// 🚀 First immediate execution
fetchStartedFixtures();

// ⏱️ Then every 15 minutes
setInterval(fetchStartedFixtures, POLL_INTERVAL);

console.log('[MONITOR] Fixture monitoring started...');