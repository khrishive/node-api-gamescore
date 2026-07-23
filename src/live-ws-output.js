import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const TOKEN = process.env.GAME_SCORE_APIKEY;

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

export function watchFixtureOutput(fixtureId) {
  if (!TOKEN) {
    console.error('[WS OUTPUT] Missing GAME_SCORE_APIKEY in environment');
    process.exit(1);
  }

  if (!fixtureId) {
    console.error('[WS OUTPUT] Missing fixtureId. Usage: node src/live-ws-output.js <fixtureId>');
    process.exit(1);
  }

  const wsUrl = `wss://api.gamescorekeeper.com/v2/live/${fixtureId}`;
  const ws = new WebSocket(wsUrl, {
    headers: {
      Authorization: `Bearer ${TOKEN}`
    }
  });

  let pingInterval;

  ws.on('open', () => {
    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message?.type === 'auth') {
        ws.send(JSON.stringify({ token: TOKEN }));
      }

      console.log(pretty(message));
    } catch (error) {
      console.error('[WS OUTPUT] Invalid JSON message:', error.message);
      console.log(String(data));
    }
  });

  ws.on('error', (error) => {
    console.error('[WS OUTPUT] Connection error:', error.message);
  });

  ws.on('close', (code, reason) => {
    clearInterval(pingInterval);
  });
}

const fixtureIdArg = process.argv[2];
watchFixtureOutput(fixtureIdArg);