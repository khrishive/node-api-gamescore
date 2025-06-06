import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GAME_SCORE_APIKEY;
const FIXTURE_ID = "910419"; 
const TOKEN = apiKey;
const WS_URL = `wss://api.gamescorekeeper.com/v2/live/${FIXTURE_ID}`;

function connectWebSocket() {
  const ws = new WebSocket(WS_URL, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`
    }
  });

  let pingInterval;

  ws.on('open', () => {
    console.log('✅ Connected to GameScorekeeper Live API');
    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping');
      }
    }, 30000);
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === 'auth') {
        ws.send(JSON.stringify({ token: TOKEN }));
      } else if (message.type === 'occurrence') {
        printHumanEvent(message.payload);
      }
      // Ignore other event types for now
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });

  ws.on('close', (code) => {
    clearInterval(pingInterval);
    console.warn(`🔄 Connection closed with code ${code}. Reconnecting in 5s...`);
    if (code !== 1000) {
      setTimeout(connectWebSocket, 5000);
    }
  });
}

function printHumanEvent(payload) {
  switch (payload.name) {
    case 'round_started':
      console.log(`\n🟢 Round ${payload.roundNumber} started.`);
      break;
    case 'kill':
      console.log(`💀 ${payload.killer?.name ?? 'Unknown'} (${payload.killer?.side ?? ''}) killed ${payload.victim?.name ?? 'Unknown'} (${payload.victim?.side ?? ''}) with a ${payload.weapon}${payload.headshot ? ' [HEADSHOT!]' : ''}.`);
      break;
    case 'assist':
      console.log(`🤝 ${payload.assister?.name ?? 'Unknown'} assisted killing ${payload.victim?.name ?? 'Unknown'}.`);
      break;
    case 'flash_assist':
      console.log(`⚡️ ${payload.assister?.name ?? 'Unknown'} flash-assisted the kill of ${payload.victim?.name ?? 'Unknown'}.`);
      break;
    case 'bomb_planted':
      console.log(`💣 ${payload.planter?.name ?? 'Unknown'} planted the bomb at site ${payload.bombSite}.`);
      break;
    case 'bomb_exploded':
      console.log(`💥 The bomb exploded! Terrorists win the round.`);
      break;
    case 'bomb_defused':
      console.log(`🛡️ The bomb was defused! Counter-Terrorists win the round.`);
      break;
    case 'round_ended':
      console.log(`🏁 Round ${payload.roundNumber} ended. Winner team ID: ${payload.winnerId} (Reason: ${payload.winCondition})`);
      break;
    case 'equipment_state':
      // Usually too detailed for human summary, can be ignored or summarized
      break;
    case 'fixture_started':
      console.log('🚩 The match has started!');
      break;
    default:
      // Uncomment if you want to see all events
      // console.log(`Other event: ${payload.name}`, payload);
      break;
  }
}

connectWebSocket();