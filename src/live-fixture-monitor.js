import dotenv from 'dotenv';
import axios from 'axios';
import { connectWebSocket } from './live-data-updater.js';

dotenv.config();

const API_KEY = process.env.GAME_SCORE_APIKEY;
const API_URL = process.env.GAME_SCORE_API;

const trackedFixtures = new Set(); // Fixture IDs a los que ya se les abrió WebSocket

// 🔄 Cambiado a 15 minutos
const POLL_INTERVAL = 15 * 60 * 1000; // 15 minutos en milisegundos

async function fetchStartedFixtures() {
  // 👉 Recalcular fecha y URL en cada ejecución
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
    console.log(`[MONITOR] [${dateStr}] Fixtures iniciados encontrados: ${fixtures.length}`);

    for (const fixture of fixtures) {
      const fixtureId = fixture.id;

      if (!trackedFixtures.has(fixtureId)) {
        console.log(`[MONITOR] Fixture iniciado detectado: ${fixtureId} - Conectando...`);
        connectWebSocket(fixtureId);
        trackedFixtures.add(fixtureId);
      }
    }
  } catch (error) {
    console.error('[MONITOR] Error al obtener fixtures:', error.message);
  }
}

// 🚀 Primera ejecución inmediata
fetchStartedFixtures();

// ⏱️ Luego cada 15 minutos
setInterval(fetchStartedFixtures, POLL_INTERVAL);

console.log('[MONITOR] Monitoreo de fixtures iniciado...');
