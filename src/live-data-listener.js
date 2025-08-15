import WebSocket from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';
import { handleLiveEvent } from './inserts/live-data/index.js'; // Importa tu función central de inserción
import mainLogger from './inserts/live-data/loggers/mainLoggers.js'; // <-- Logger centralizado

dotenv.config();

// Lee la API Key desde tus variables de entorno
const apiKey = process.env.GAME_SCORE_APIKEY;



const TOKEN = apiKey;


let reconnectAttempts = 0;

export function connectWebSocket(fixture_id) {

  // Contexto para guardar los IDs actuales de fixture, mapa y ronda
  let context = {
    fixtureId: fixture_id,
    mapNumber: null,
    roundNumber: null,
    // Puedes agregar más campos si necesitas
  };

  // URL del WebSocket de GameScorekeeper
  const WS_URL = `wss://api.gamescorekeeper.com/v2/live/${fixture_id}`;
  // Crea la conexión al WebSocket con el header de autenticación
  const ws = new WebSocket(WS_URL, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`
    }
  });

  let pingInterval;

  ws.on('open', () => {
    mainLogger.info({
      msg: '[WebSocket] Conectado a GameScorekeeper Live API',
      fixtureId: context.fixtureId
    });
    reconnectAttempts = 0;

    // Envía pings cada 30 segundos para mantener viva la conexión
    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);
  });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);

      // Log del mensaje recibido para auditoría (puedes ajustar nivel)
      mainLogger.debug({
        msg: '[WebSocket] Mensaje recibido',
        message
      });

      // Guarda el evento en un archivo para auditoría/debug (opcional)
      //fs.appendFileSync('output.txt', JSON.stringify(message, null, 2) + '\n');

      // Actualiza el contexto según el tipo de evento recibido
      if (message.type === 'occurrence' && message.payload) {
        const name = message.payload.name;
        if (name === 'map_started') {
          // Cuando inicia un mapa, actualiza el mapId, resetea roundId
          context.mapNumber = message.payload.mapNumber || message.payload.mapNumber || null;
          context.roundNumber  = null;
        }
        if (name === 'round_started') {
          // Cuando inicia una ronda, actualiza el roundId
          context.roundNumber  = message.payload.roundNumber  || message.payload.roundNumber  || null;
        }
        // Puedes agregar más lógica aquí si necesitas más IDs del contexto
      }

      // Llama a la función central para insertar el evento en la base de datos
      if (context.fixtureId) {
        console.log(`Procesando evento para fixtureId: ${context.fixtureId}`);
        await handleLiveEvent(message, context);
        console.log(`Evento procesado para fixtureId: ${context.fixtureId}`);
        
      }

      // Procesamiento de otros tipos de mensajes
      if (message.type === 'auth') {
        ws.send(JSON.stringify({ token: TOKEN }));
      } else if (message.type === 'pong') {
        mainLogger.debug({ msg: '[WebSocket] Pong recibido' });
      } else if (message.type === 'ended') {
        mainLogger.warn({ msg: '[WebSocket] Mensaje de fin recibido' });
      } else {
        // Otros mensajes para debug si lo deseas
        // mainLogger.debug({ msg: '[WebSocket] Otro mensaje', message });
      }
    } catch (error) {
      mainLogger.error({
        msg: '[WebSocket] Error al procesar mensaje',
        error: error.message,
        stack: error.stack
      });
    }
  });

  ws.on('error', (error) => {
    mainLogger.error({
      msg: '[WebSocket] Error en la conexión',
      error: error.message,
      stack: error.stack,
      fixtureId: context.fixtureId
    });
  });

  ws.on('close', (code, reason) => {
    clearInterval(pingInterval);
    mainLogger.warn({
      msg: '[WebSocket] Conexión cerrada. Intentando reconectar...',
      code,
      reason: reason ? reason.toString() : '',
      fixtureId: context.fixtureId,
      attempt: reconnectAttempts + 1
    });
    if (code !== 1000) { // No reconectar si el cierre es normal
      reconnectAttempts++;
      const timeout = Math.min(30000, 5000 * reconnectAttempts);
      setTimeout(connectWebSocket, timeout);
      mainLogger.info({
        msg: '[WebSocket] Reintentando conexión',
        attempt: reconnectAttempts,
        espera_ms: timeout,
        fixtureId: context.fixtureId
      });
    } else {
      reconnectAttempts = 0;
      mainLogger.info({
        msg: '[WebSocket] Conexión cerrada de forma normal',
        code,
        fixtureId: context.fixtureId
      });
    }
  });
}

// Inicia la conexión cuando ejecutas este archivo
connectWebSocket();