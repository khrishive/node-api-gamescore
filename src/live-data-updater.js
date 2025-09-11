import WebSocket from 'ws';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// API Keys and endpoint
const apiKey = process.env.GAME_SCORE_APIKEY;
const TOKEN = apiKey;
const WP_API_KEY = process.env.POST_SYNC_API_KEY; // Your API Key for WP
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
    ended: false // 🔹 flag to know if it has already finished
  };

  const WS_URL = `wss://api.gamescorekeeper.com/v2/live/${fixture_id}`;
  const ws = new WebSocket(WS_URL, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`
    }
  });

  let pingInterval;

  ws.on('open', () => {
    console.log(`[WebSocket] Connected to fixture ${context.fixtureId}`);
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

      // --- Detect start of the match ---
      if (message.type === 'fixture_started') {
        const fixtureId = message.payload.fixtureId;

        console.log('[WebSocket] fixture_started event detected:', { fixtureId });

        const payload = {
          external_id: fixtureId,
          status: 'Started'
        };

        // --- Send to WP DEV ---
        try {
          const res = await axios.post(WP_DEV_URL, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            }
          });
          console.log('[POST -> WP DEV] Response:', res.data);
        } catch (err) {
          console.error('[POST -> WP DEV] Error sending:', err.message);
        }

        // --- Send to WP STAGING ---
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
          console.log('[POST -> WP STAGING] Response:', res.data);
        } catch (err) {
          console.error('[POST -> WP STAGING] Error sending:', err.message);
        }

        // --- Send to WP PROD ---
        try {
          const res = await axios.post(WP_PROD_URL, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            }
          });
          console.log('[POST -> WP PROD] Response:', res.data);
        } catch (err) {
          console.error('[POST -> WP PROD] Error sending:', err.message);
        }

        // --- Send to RR DEV ---
        try {
          const res = await axios.post(RR_DEV_URL, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            }
          });
          console.log('[POST -> RR DEV] Response:', res.data);
        } catch (err) {
          console.error('[POST -> RR DEV] Error sending:', err.message);
        }
      }

      // --- Detect end of the match ---
      if (message.type === 'fixture_ended') {
        const fixtureId = message.payload.fixtureId;

        console.log('[WebSocket] fixture_started event detected:', { fixtureId });

        const payload = {
          external_id: fixtureId,
          status: 'Ended'
        };

        // --- Send to WP DEV ---
        try {
          const res = await axios.post(WP_DEV_URL, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            }
          });
          console.log('[POST -> WP DEV] Response:', res.data);
        } catch (err) {
          console.error('[POST -> WP DEV] Error sending:', err.message);
        }

        // --- Send to WP STAGING ---
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
          console.log('[POST -> WP STAGING] Response:', res.data);
        } catch (err) {
          console.error('[POST -> WP STAGING] Error sending:', err.message);
        }

        // --- Send to WP PROD ---
        try {
          const res = await axios.post(WP_PROD_URL, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            }
          });
          console.log('[POST -> WP PROD] Response:', res.data);
        } catch (err) {
          console.error('[POST -> WP PROD] Error sending:', err.message);
        }

        // --- Send to RR DEV ---
        try {
          const res = await axios.post(RR_DEV_URL, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': WP_API_KEY
            }
          });
          console.log('[POST -> RR DEV] Response:', res.data);
        } catch (err) {
          console.error('[POST -> RR DEV] Error sending:', err.message);
        }
      }



      // --- Detect score_changed ---
      if (message.type === 'score_changed') {
        const fixtureId = message.payload.fixtureId;
        const scores = message.payload.scores;

        console.log('[WebSocket] score_changed event detected:', { fixtureId, scores });

        // --- Send to WP DEV ---
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

          console.log('[POST -> WP DEV] Response:', res.data);
        } catch (err) {
          console.error('[POST -> WP DEV] Error sending:', err.message);
        }

        // --- Send to WP STAGING ---
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

          console.log('[POST -> WP STAGING] Response:', res.data);
        } catch (err) {
          console.error('[POST -> WP STAGING] Error sending:', err.message);
        }

        // --- Send to WP PROD ---

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

          console.log('[POST -> WP PROD] Response:', res.data);
        } catch (err) {
          console.error('[POST -> WP PROD] Error sending:', err.message);
        }

        // --- Send to RR DEV ---
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

          console.log('[POST -> RR DEV] Response:', res.data);
        } catch (err) {
          console.error('[POST -> RR DEV] Error sending:', err.message);
        }
      }

      // --- Update context ---
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

      // --- System events ---
      if (message.type === 'auth') {
        ws.send(JSON.stringify({ token: TOKEN }));
      } else if (message.type === 'pong') {
        console.log('[WebSocket] Pong received');
      } else if (message.type === 'ended') {
        console.log(`[WebSocket] Fixture ${context.fixtureId} finished`);
        context.ended = true;
        ws.close(1000, 'Fixture finished'); // 🔹 clean closure
      }

    } catch (error) {
      console.error('[WebSocket] Error processing message:', error.message);
    }
  });

  ws.on('error', (error) => {
    console.error(`[WebSocket] Connection error (${context.fixtureId}):`, error.message);
  });

  ws.on('close', (code, reason) => {
    clearInterval(pingInterval);
    console.warn(`[WebSocket] Connection closed for fixture ${context.fixtureId}. Code: ${code}, Reason: ${reason}`);

    // 🔹 Do not reconnect if the fixture is finished
    if (context.ended) {
      console.log(`[WebSocket] Fixture ${context.fixtureId} has already finished, it will not be retried.`);
      return;
    }

    // 🔹 Normal closure → do not reconnect
    if (code === 1000) {
      console.log(`[WebSocket] Connection closed normally (${context.fixtureId}), it will not be retried.`);
      reconnectAttempts = 0;
      return;
    }

    // 🔹 Abnormal errors → limit attempts
    reconnectAttempts++;
    if (reconnectAttempts > 5) {
      console.error(`[WebSocket] Too many failed attempts (${context.fixtureId}), stopping reconnections.`);
      return;
    }

    const timeout = Math.min(30000, 5000 * reconnectAttempts);
    console.log(`[WebSocket] Retrying connection in ${timeout}ms (Attempt ${reconnectAttempts})`);
    setTimeout(() => connectWebSocket(fixture_id), timeout);
  });
}

// Start the test connection
connectWebSocket();