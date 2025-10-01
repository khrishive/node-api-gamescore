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
  // 👉 Recalculate date and URL in each execution
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const API = `${API_URL}/fixtures?status=started&from=${dateStr}&sport=cs2&to=${dateStr}`;

  try {
    const response = await axios.get(API, {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      }
    });

    const fixtures = response.data.fixtures || [];
    console.log(`[MONITOR] [${dateStr}] Started fixtures found: ${fixtures.length}`);

    for (const fixture of fixtures) {
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