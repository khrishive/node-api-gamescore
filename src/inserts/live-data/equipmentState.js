import { db } from '../../db.js';
import equipmentStateLogger from './loggers/equipmentStateLogger.js';

function isValidPlayer(player) {
  return (
    player &&
    player.playerId &&
    player.teamId !== undefined &&
    player.money !== undefined &&
    player.primaryWeapon !== undefined &&
    player.kevlar !== undefined &&
    player.helmet !== undefined &&
    player.defuseKit !== undefined
  );
}

function isValidEquipmentState(equipmentStateEvent, fixtureId, mapId, roundId) {
  return (
    equipmentStateEvent &&
    Array.isArray(equipmentStateEvent.players) &&
    equipmentStateEvent.players.length > 0 &&
    fixtureId && mapId && roundId &&
    equipmentStateEvent.timestamp
  );
}

export async function insertEquipmentState(equipmentStateEvent, fixtureId, mapId, roundId) {
  equipmentStateLogger.debug({
    msg: '[insertEquipmentState] Datos recibidos para insert',
    equipmentStateEvent, fixtureId, mapId, roundId
  });

  if (!isValidEquipmentState(equipmentStateEvent, fixtureId, mapId, roundId)) {
    equipmentStateLogger.warn({
      msg: '[insertEquipmentState] Datos incompletos, se omite insert',
      equipmentStateEvent, fixtureId, mapId, roundId
    });
    return;
  }

  const { players, timestamp } = equipmentStateEvent;

  for (const player of players) {
    equipmentStateLogger.debug({
      msg: '[insertEquipmentState] Procesando player',
      player, fixtureId, mapId, roundId, timestamp
    });

    if (!isValidPlayer(player)) {
      equipmentStateLogger.warn({
        msg: '[insertEquipmentState] Datos incompletos de jugador, se omite insert para este jugador',
        player, fixtureId, mapId, roundId, timestamp
      });
      continue;
    }

    try {
      await db.query(`
        INSERT IGNORE INTO equipment_state (
          round_id, map_id, fixture_id,
          player_id, team_id,
          money, primary_weapon, kevlar, helmet, defuse_kit, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        roundId, mapId, fixtureId,
        player.playerId, player.teamId,
        player.money, player.primaryWeapon, player.kevlar, player.helmet, player.defuseKit, timestamp
      ]);
      equipmentStateLogger.debug({
        msg: '[insertEquipmentState] Equipment state insertado',
        roundId, mapId, fixtureId,
        playerId: player.playerId,
        teamId: player.teamId,
        money: player.money,
        primaryWeapon: player.primaryWeapon,
        kevlar: player.kevlar,
        helmet: player.helmet,
        defuseKit: player.defuseKit,
        timestamp
      });
    } catch (error) {
      equipmentStateLogger.error({
        msg: '[insertEquipmentState] Error al insertar equipment state',
        error: error.message,
        player, fixtureId, mapId, roundId, timestamp
      });
    }
  }
}