import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();



const apiKey = process.env.GAME_SCORE_APIKEY

// Reemplaza con tu Fixture ID y Token
const FIXTURE_ID = "888609"; // Debes obtenerlo dinámicamente
const TOKEN = apiKey; 

// URL de la Live Data API
const WS_URL = `wss://api.gamescorekeeper.com/v2/live/${FIXTURE_ID}`;

function connectWebSocket() {
  const ws = new WebSocket(WS_URL, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`
    }
  });

  let pingInterval;

  ws.on('open', () => {
    console.log('✅ Conectado a GameScorekeeper Live API');

    // Enviar mensajes de ping cada 30 segundos
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
        // Responder con el token de autenticación
        ws.send(JSON.stringify({ token: TOKEN }));
      } else if (message.type === 'pong') {
        console.log('📡 Pong recibido');
      } else if (message.type === 'ended') {
        console.warn('⚠️ Mensaje desconocido:', message);
      } else {
        console.log('📩 Mensaje recibido:', message);
      }
    } catch (error) {
      console.error('❌ Error al procesar mensaje:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ Error en WebSocket:', error);
  });

  ws.on('close', (code) => {
    clearInterval(pingInterval);
    console.warn(`🔄 Conexión cerrada con código ${code}. Reintentando en 5s...`);
    if (code !== 1000) { // No reconectar si el cierre es normal
      setTimeout(connectWebSocket, 5000);
    }
  });
}

connectWebSocket();