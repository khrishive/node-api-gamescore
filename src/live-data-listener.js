import WebSocket from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';
import { handleLiveEvent } from './inserts/live-data/index.js'; // Import your central insertion function
import mainLogger from './inserts/live-data/loggers/mainLoggers.js'; // <-- Centralized logger

dotenv.config();

// Read the API Key from your environment variables
const apiKey = process.env.GAME_SCORE_APIKEY;



const TOKEN = apiKey;


let reconnectAttempts = 0;

export function connectWebSocket(fixture_id) {
  console.log(`Connecting WebSocket for fixture ID: ${fixture_id}`);
  // Context to save the current fixture, map and round IDs
  let context = {
    fixtureId: fixture_id,
    mapNumber: null,
    roundNumber: null,
    // You can add more fields if you need
  };

  // GameScorekeeper WebSocket URL
  const WS_URL = `wss://api.gamescorekeeper.com/v2/live/${fixture_id}`;
  // Create the WebSocket connection with the authentication header
  const ws = new WebSocket(WS_URL, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`
    }
  });

  let pingInterval;

  ws.on('open', () => {
    mainLogger.info({
      msg: '[WebSocket] Connected to GameScorekeeper Live API',
      fixtureId: context.fixtureId
    });
    reconnectAttempts = 0;

    // Send pings every 30 seconds to keep the connection alive
    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);
  });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);

      // Log of the message received for auditing (you can adjust the level)
      mainLogger.debug({
        msg: '[WebSocket] Message received',
        message
      });

      // Save the event to a file for auditing/debug (optional)

      // Update the context according to the type of event received
      if (message.type === 'occurrence' && message.payload) {
        const name = message.payload.name;
        if (name === 'map_started') {
          // When a map starts, update the mapId, reset roundId
          context.mapNumber = message.payload.mapNumber || message.payload.mapNumber || null;
          context.roundNumber  = null;
        }
        if (name === 'round_started') {
          // When a round starts, update the roundId
          context.roundNumber  = message.payload.roundNumber  || message.payload.roundNumber  || null;
        }
        // You can add more logic here if you need more IDs from the context
      }

      // Call the central function to insert the event into the database
      if (context.fixtureId) {
        console.log(`Processing event for fixtureId: ${context.fixtureId}`);
        await handleLiveEvent(message, context);
        console.log(`Event processed for fixtureId: ${context.fixtureId}`);
        
      }

      // Processing other types of messages
      if (message.type === 'auth') {
        ws.send(JSON.stringify({ token: TOKEN }));
      } else if (message.type === 'pong') {
        mainLogger.debug({ msg: '[WebSocket] Pong received' });
      } else if (message.type === 'ended') {
        mainLogger.warn({ msg: '[WebSocket] End message received' });
      } else {
        // Other messages for debug if you wish
        // mainLogger.debug({ msg: '[WebSocket] Other message', message });
      }
    } catch (error) {
      mainLogger.error({
        msg: '[WebSocket] Error processing message',
        error: error.message,
        stack: error.stack
      });
    }
  });

  ws.on('error', (error) => {
    mainLogger.error({
      msg: '[WebSocket] Connection error',
      error: error.message,
      stack: error.stack,
      fixtureId: context.fixtureId
    });
  });

  ws.on('close', (code, reason) => {
    clearInterval(pingInterval);
    mainLogger.warn({
      msg: '[WebSocket] Connection closed. Trying to reconnect...',
      code,
      reason: reason ? reason.toString() : '',
      fixtureId: context.fixtureId,
      attempt: reconnectAttempts + 1
    });
    if (code !== 1000) { // Do not reconnect if the closure is normal
      reconnectAttempts++;
      const timeout = Math.min(30000, 5000 * reconnectAttempts);
      setTimeout(connectWebSocket, timeout);
      mainLogger.info({
        msg: '[WebSocket] Retrying connection',
        attempt: reconnectAttempts,
        wait_ms: timeout,
        fixtureId: context.fixtureId
      });
    } else {
      reconnectAttempts = 0;
      mainLogger.info({
        msg: '[WebSocket] Connection closed normally',
        code,
        fixtureId: context.fixtureId
      });
    }
  });
}

// Start the connection when you run this file
connectWebSocket();