import dotenv from 'dotenv';
import axios from 'axios';
import { connectWebSocket } from './live-data-listener.js'; // Tu archivo existente

dotenv.config();

const API_KEY = process.env.GAME_SCORE_APIKEY;
const API_URL = process.env.GAME_SCORE_API
const now = new Date();
const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
const API = `${API_URL}/fixtures?status=started&from=${dateStr}&sport=cs2&to=${dateStr}`;

const trackedFixtures = new Set(); // Fixture IDs a los que ya se les abrió WebSocket

const POLL_INTERVAL = 30 * 1000; // 30 segundos

async function fetchStartedFixtures() {
  

  try {
    const response = await axios.get(API, {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      }
    });

    const fixtures = response.data.fixtures || [];
    console.log(`[MONITOR] Fixtures iniciados encontrados: ${fixtures.length}`);
    for (const fixture of fixtures) {
      const fixtureId = fixture.id;

      // Si aún no hemos conectado este fixture, abrimos WebSocket
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

// Inicia el monitoreo en intervalos
setInterval(fetchStartedFixtures, POLL_INTERVAL);
console.log('[MONITOR] Monitoreo de fixtures iniciado...');
