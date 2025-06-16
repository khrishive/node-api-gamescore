import { insertKill } from './Kills.js';
import { insertAssist } from './assists.js';
import { insertMap } from './maps.js';
import { insertRound } from './rounds.js';
import { insertEquipmentState } from './equipmentState.js';
import { insertRawEvent } from './eventsRaw.js';
import { ensurePlayerExists, ensureTeamExists } from './utils.js';
import indexLogger from './loggers/indexLogger.js';

// Este archivo recibe un evento y lo despacha a la función adecuada según el tipo
export async function handleLiveEvent(event, context) {
  const { fixtureId, mapNumber, roundNumber } = context;

  // Log de debug con los datos recibidos
  indexLogger.debug({
    msg: '[handleLiveEvent] Evento recibido',
    event, context
  });

  // Guarda el evento crudo (opcional)
  try {
    await insertRawEvent(event, fixtureId, event.type, event.payload?.timestamp ?? Date.now());
    indexLogger.debug({
      msg: '[handleLiveEvent] Evento crudo guardado',
      fixtureId, eventType: event.type, timestamp: event.payload?.timestamp ?? Date.now()
    });
  } catch (error) {
    indexLogger.error({
      msg: '[handleLiveEvent] Error al guardar evento crudo',
      error: error.message,
      fixtureId, eventType: event.type
    });
  }

  if (event.type === 'occurrence' && event.payload) {
    const { name } = event.payload;

    try {
      switch (name) {
        case 'kill':
          indexLogger.debug({
            msg: '[handleLiveEvent] Procesando evento kill',
            fixtureId, mapNumber, roundNumber, payload: event.payload
          });

          await ensurePlayerExists(event.payload.killer);
          await ensurePlayerExists(event.payload.victim);
          await ensureTeamExists(event.payload.killer?.teamId, event.payload.killer?.side);
          await ensureTeamExists(event.payload.victim?.teamId, event.payload.victim?.side);

          await insertKill(event.payload, fixtureId, mapNumber, roundNumber);
          indexLogger.debug({
            msg: '[handleLiveEvent] Evento kill procesado',
            fixtureId, mapNumber, roundNumber, payload: event.payload
          });
          break;

        case 'assist':
        case 'flash_assist':
          indexLogger.debug({
            msg: `[handleLiveEvent] Procesando evento ${name}`,
            fixtureId, mapNumber, roundNumber, payload: event.payload
          });

          await ensurePlayerExists(event.payload.assister);
          await ensurePlayerExists(event.payload.victim);
          await ensureTeamExists(event.payload.assister?.teamId, event.payload.assister?.side);
          await ensureTeamExists(event.payload.victim?.teamId, event.payload.victim?.side);

          await insertAssist(event.payload, fixtureId, mapNumber, roundNumber, name);
          indexLogger.debug({
            msg: `[handleLiveEvent] Evento ${name} procesado`,
            fixtureId, mapNumber, roundNumber, payload: event.payload
          });
          break;

        case 'map_started':
          indexLogger.debug({
            msg: '[handleLiveEvent] Procesando evento map_started',
            fixtureId, payload: event.payload
          });

          await insertMap(event.payload, fixtureId);
          indexLogger.debug({
            msg: '[handleLiveEvent] Evento map_started procesado',
            fixtureId, payload: event.payload
          });
          break;

        case 'round_ended':
          indexLogger.debug({
            msg: '[handleLiveEvent] Procesando evento round_ended',
            mapNumber, payload: event.payload
          });

          await insertRound(event.payload, mapNumber);
          indexLogger.debug({
            msg: '[handleLiveEvent] Evento round_ended procesado',
            mapNumber, payload: event.payload
          });
          break;

        case 'equipment_state':
          indexLogger.debug({
            msg: '[handleLiveEvent] Procesando evento equipment_state',
            fixtureId, mapNumber, roundNumber, payload: event.payload
          });

          await insertEquipmentState(event.payload, fixtureId, mapNumber, roundNumber);
          indexLogger.debug({
            msg: '[handleLiveEvent] Evento equipment_state procesado',
            fixtureId, mapNumber, roundNumber, payload: event.payload
          });
          break;

        default:
          indexLogger.warn({
            msg: '[handleLiveEvent] Evento desconocido, ignorado',
            name, event
          });
          break;
      }
    } catch (error) {
      indexLogger.error({
        msg: `[handleLiveEvent] Error procesando evento ${name}`,
        error: error.message,
        event, context
      });
    }
  }
}