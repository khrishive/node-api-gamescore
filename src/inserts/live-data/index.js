import { insertKill } from './Kills.js';
import { insertAssist } from './assists.js';
import { insertMap } from './maps.js';
import { insertRound } from './rounds.js';
import { insertEquipmentState } from './equipmentState.js';
import { ensurePlayerExists, ensureTeamExists } from './utils.js';
import indexLogger from './loggers/indexLogger.js';

// Este archivo recibe un evento y lo despacha a la función adecuada según el tipo.
//
// context.mapId / context.roundId hold the real DB ids (maps.id / rounds.id),
// not the map/round *numbers* GSK sends — kills, assists and equipment_state
// are foreign-keyed to those ids, so they're tracked here and updated as
// map_started/round_started events come in, ahead of anything that needs them.
export async function handleLiveEvent(event, context) {
  const { fixtureId } = context;

  // Raw event storage (events_raw) is deliberately left disabled: nothing in
  // the props pipeline reads it, and GSK's own historic API can be re-queried
  // per fixture on demand, so there's no need to duplicate and grow that
  // table ourselves. Revisit only if that stops being true.

  if (event.type !== 'occurrence' || !event.payload) {
    return;
  }

  const { name } = event.payload;

  try {
    switch (name) {
      case 'map_started': {
        context.mapNumber = event.payload.mapNumber ?? null;
        context.mapName = event.payload.mapName ?? null;
        context.roundId = null;
        context.roundNumber = null;

        context.mapId = await insertMap(
          { mapNumber: context.mapNumber, mapName: context.mapName, status: 'started' },
          fixtureId
        );
        break;
      }

      case 'map_ended': {
        const mapNumber = event.payload.mapNumber ?? context.mapNumber;
        await insertMap(
          { mapNumber, mapName: context.mapName, status: 'ended' },
          fixtureId
        );
        break;
      }

      case 'round_started': {
        context.roundNumber = event.payload.roundNumber ?? null;
        context.roundId = await insertRound(event.payload, context.mapId, fixtureId);
        break;
      }

      case 'round_ended': {
        context.roundId = await insertRound(event.payload, context.mapId, fixtureId);
        break;
      }

      case 'kill':
        await ensurePlayerExists(event.payload.killer);
        await ensurePlayerExists(event.payload.victim);
        await ensureTeamExists(event.payload.killer?.teamId);
        await ensureTeamExists(event.payload.victim?.teamId);

        await insertKill(event.payload, fixtureId, context.mapId, context.roundId);
        break;

      case 'assist':
      case 'flash_assist':
        await ensurePlayerExists(event.payload.assister);
        await ensurePlayerExists(event.payload.victim);
        await ensureTeamExists(event.payload.assister?.teamId);
        await ensureTeamExists(event.payload.victim?.teamId);

        await insertAssist(event.payload, fixtureId, context.mapId, context.roundId, name);
        break;

      case 'equipment_state':
        await insertEquipmentState(event.payload, fixtureId, context.mapId, context.roundId);
        break;

      default:
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
