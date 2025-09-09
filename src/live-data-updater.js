import WebSocket from 'ws';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// API Keys y endpoint
const apiKey = process.env.GAME_SCORE_APIKEY;
const TOKEN = apiKey;
const WP_API_KEY = process.env.POST_SYNC_API_KEY; // Tu API Key para WP
const WP_DEV_URL = 'https://wordpressmu-1372681-5818581.cloudwaysapps.com/wp-json/fixtures/v1/update';
const WP_STAGING_URL = 'https://wordpressmu-1301114-4845462.cloudwaysapps.com/wp-json/fixtures/v1/update';
const WP_PROD_URL = 'https://www.hotspawn.com/wp-json/fixtures/v1/update';
const RR_DEV_URL = 'https://wordpress-1372681-5668655.cloudwaysapps.com/wp-json/fixtures/v1/update';

let reconnectAttempts = 0;

export function connectWebSocket(fixture_id) {
  let context = {
    fixtureId: fixture_id,
    mapNumber: null,
    roundNumber: null,
    ended: false // 🔹 bandera para saber si ya terminó
  };

  const WS_URL = `wss://api.gamescorekeeper.com/v2/live/${fixture_id}`;
  const ws = new WebSocket(WS_URL, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`
    }
  });

  let pingInterval;

  ws.on('open', () => {
    console.log(`[WebSocket] Conectado al fixture ${context.fixtureId}`);
    reconnectAttempts = 0;

    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);
  });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);

      // --- Detectar inicio del partido ---
      if (message.type === 'fixture_started') {
        const fixtureId = message.payload.fixtureId;

        console.log('[WebSocket] Evento fixture_started detectado:', { fixtureId });

        const payload = {
          external_id: fixtureId,
          status: 'Started'
        };

        // --- Envío a WP DEV ---
        try {
          const res = await axios.post(WP_DEV_URL, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            }
          });
          console.log('[POST -> WP DEV] Respuesta:', res.data);
        } catch (err) {
          console.error('[POST -> WP DEV] Error al enviar:', err.message);
        }

        // --- Envío a WP STAGING ---
        try {
          const res = await axios.post(WP_STAGING_URL, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            },
            auth: {
              username: 'fpmpuvheeq',
              password: 'ENPK9JE57j'
            }
          });
          console.log('[POST -> WP STAGING] Respuesta:', res.data);
        } catch (err) {
          console.error('[POST -> WP STAGING] Error al enviar:', err.message);
        }

        // --- Envío a WP PROD ---
        try {
          const res = await axios.post(WP_PROD_URL, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            }
          });
          console.log('[POST -> WP PROD] Respuesta:', res.data);
        } catch (err) {
          console.error('[POST -> WP PROD] Error al enviar:', err.message);
        }

        // --- Envío a RR DEV ---
        try {
          const res = await axios.post(RR_DEV_URL, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            }
          });
          console.log('[POST -> RR DEV] Respuesta:', res.data);
        } catch (err) {
          console.error('[POST -> RR DEV] Error al enviar:', err.message);
        }
      }

      // --- Detectar final del partido ---
      if (message.type === 'fixture_ended') {
        const fixtureId = message.payload.fixtureId;

        console.log('[WebSocket] Evento fixture_started detectado:', { fixtureId });

        const payload = {
          external_id: fixtureId,
          status: 'Ended'
        };

        // --- Envío a WP DEV ---
        try {
          const res = await axios.post(WP_DEV_URL, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            }
          });
          console.log('[POST -> WP DEV] Respuesta:', res.data);
        } catch (err) {
          console.error('[POST -> WP DEV] Error al enviar:', err.message);
        }

        // --- Envío a WP STAGING ---
        try {
          const res = await axios.post(WP_STAGING_URL, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            },
            auth: {
              username: 'fpmpuvheeq',
              password: 'ENPK9JE57j'
            }
          });
          console.log('[POST -> WP STAGING] Respuesta:', res.data);
        } catch (err) {
          console.error('[POST -> WP STAGING] Error al enviar:', err.message);
        }

        // --- Envío a WP PROD ---
        try {
          const res = await axios.post(WP_PROD_URL, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            }
          });
          console.log('[POST -> WP PROD] Respuesta:', res.data);
        } catch (err) {
          console.error('[POST -> WP PROD] Error al enviar:', err.message);
        }

        // --- Envío a RR DEV ---
        try {
          const res = await axios.post(RR_DEV_URL, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            }
          });
          console.log('[POST -> RR DEV] Respuesta:', res.data);
        } catch (err) {
          console.error('[POST -> RR DEV] Error al enviar:', err.message);
        }
      }



      // --- Detectar score_changed ---
      if (message.type === 'score_changed') {
        const fixtureId = message.payload.fixtureId;
        const scores = message.payload.scores;

        console.log('[WebSocket] Evento score_changed detectado:', { fixtureId, scores });

        // --- Envío a WP DEV ---
        try {
          const res = await axios.post(WP_DEV_URL, {
            external_id: fixtureId,
            participants0_id: scores[0]?.id || null,
            participants0_score: scores[0]?.score ?? null,
            participants1_id: scores[1]?.id || null,
            participants1_score: scores[1]?.score ?? null
          }, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            }
          });

          console.log('[POST -> WP DEV] Respuesta:', res.data);
        } catch (err) {
          console.error('[POST -> WP DEV] Error al enviar:', err.message);
        }

        // --- Envío a WP STAGING ---
        try {
          

          const res = await axios.post(WP_STAGING_URL, {
            external_id: fixtureId,
            participants0_id: scores[0]?.id || null,
            participants0_score: scores[0]?.score ?? null,
            participants1_id: scores[1]?.id || null,
            participants1_score: scores[1]?.score ?? null
          }, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            },
            auth: {
              username: 'fpmpuvheeq',
              password: 'ENPK9JE57j'
            }
          });

          console.log('[POST -> WP STAGING] Respuesta:', res.data);
        } catch (err) {
          console.error('[POST -> WP STAGING] Error al enviar:', err.message);
        }

        // --- Envío a WP PROD ---

        try {
          

          const res = await axios.post(WP_PROD_URL, {
            external_id: fixtureId,
            participants0_id: scores[0]?.id || null,
            participants0_score: scores[0]?.score ?? null,
            participants1_id: scores[1]?.id || null,
            participants1_score: scores[1]?.score ?? null
          }, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            }
          });

          console.log('[POST -> WP PROD] Respuesta:', res.data);
        } catch (err) {
          console.error('[POST -> WP PROD] Error al enviar:', err.message);
        }

        // --- Envío a RR DEV ---
        try {
          const res = await axios.post(RR_DEV_URL, {
            external_id: fixtureId,
            participants0_id: scores[0]?.id || null,
            participants0_score: scores[0]?.score ?? null,
            participants1_id: scores[1]?.id || null,
            participants1_score: scores[1]?.score ?? null
          }, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            }
          });

          console.log('[POST -> RR DEV] Respuesta:', res.data);
        } catch (err) {
          console.error('[POST -> RR DEV] Error al enviar:', err.message);
        }
      }

      // --- Actualizar contexto ---
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

      // --- Eventos de sistema ---
      if (message.type === 'auth') {
        ws.send(JSON.stringify({ token: TOKEN }));
      } else if (message.type === 'pong') {
        console.log('[WebSocket] Pong recibido');
      } else if (message.type === 'ended') {
        console.log(`[WebSocket] Fixture ${context.fixtureId} finalizado`);
        context.ended = true;
        ws.close(1000, 'Fixture terminado'); // 🔹 cierre limpio
      }

    } catch (error) {
      console.error('[WebSocket] Error al procesar mensaje:', error.message);
    }
  });

  ws.on('error', (error) => {
    console.error(`[WebSocket] Error en la conexión (${context.fixtureId}):`, error.message);
  });

  ws.on('close', (code, reason) => {
    clearInterval(pingInterval);
    console.warn(`[WebSocket] Conexión cerrada para fixture ${context.fixtureId}. Code: ${code}, Reason: ${reason}`);

    // 🔹 No reconectar si el fixture terminó
    if (context.ended) {
      console.log(`[WebSocket] Fixture ${context.fixtureId} ya terminó, no se reintentará.`);
      return;
    }

    // 🔹 Cierre normal → no reconectar
    if (code === 1000) {
      console.log(`[WebSocket] Conexión cerrada de forma normal (${context.fixtureId}), no se reintentará.`);
      reconnectAttempts = 0;
      return;
    }

    // 🔹 Errores anormales → limitar intentos
    reconnectAttempts++;
    if (reconnectAttempts > 5) {
      console.error(`[WebSocket] Demasiados intentos fallidos (${context.fixtureId}), deteniendo reconexiones.`);
      return;
    }

    const timeout = Math.min(30000, 5000 * reconnectAttempts);
    console.log(`[WebSocket] Reintentando conexión en ${timeout}ms (Intento ${reconnectAttempts})`);
    setTimeout(() => connectWebSocket(fixture_id), timeout);
  });
}

// Inicia la conexión de prueba
connectWebSocket();
