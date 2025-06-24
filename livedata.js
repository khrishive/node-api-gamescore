import WebSocket from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();



const apiKey = process.env.GAME_SCORE_APIKEY

// Reemplaza con tu Fixture ID y Token
const FIXTURE_ID = "908734"; // Debes obtenerlo dinámicamente
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
        ws.ping();
      }
    }, 30000);
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      // Guarda en un archivo .txt (agrega al final)
      fs.appendFileSync('output.txt', JSON.stringify(message, null, 2) + '\n');

      if (message.type === 'auth') {
        // Responder con el token de autenticación
        ws.send(JSON.stringify({ token: TOKEN }));
      } else if (message.type === 'pong') {
        console.log('📡 Pong recibido');
      } else if (message.type === 'ended') {
        console.warn('⚠️ Mensaje desconocido:', message);
      } else {
        console.dir(message, { depth: null, colors: true });
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