import { db } from '../../db.js';
import assistsLogger from './loggers/assistsLogger.js';

function isValidAssistEvent(assistEvent, fixtureId, mapId, roundId, type) {
  return (
    assistEvent &&
    assistEvent.id &&
    assistEvent.assister && assistEvent.assister.id &&
    assistEvent.victim && assistEvent.victim.id &&
    typeof assistEvent.timestamp !== 'undefined' &&
    fixtureId && mapId && roundId && type
  );
}

export async function insertAssist(assistEvent, fixtureId, mapId, roundId, type) {
  assistsLogger.debug({
    msg: '[insertAssist] Datos recibidos para insert',
    assistEvent, fixtureId, mapId, roundId, type
  });

  if (!isValidAssistEvent(assistEvent, fixtureId, mapId, roundId, type)) {
    assistsLogger.warn({
      msg: '[insertAssist] Datos incompletos, se omite insert',
      assistEvent, fixtureId, mapId, roundId, type
    });
    return;
  }

  const {
    id, assister, victim, killId, timestamp
  } = assistEvent;

  try {
    await db.query(`
      INSERT IGNORE INTO assists (
        id, round_id, map_id, fixture_id, assister_id, victim_id, kill_id, type, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, roundId, mapId, fixtureId, assister.id, victim.id, killId, type, timestamp
    ]);
    assistsLogger.debug({
      msg: '[insertAssist] Assist insertado',
      id, roundId, mapId, fixtureId,
      assisterId: assister.id,
      victimId: victim.id,
      killId, type, timestamp
    });

    console('asistencia pricesada')
  } catch (error) {
    assistsLogger.error({
      msg: '[insertAssist] Error al insertar assist',
      error: error.message,
      assistEvent, fixtureId, mapId, roundId, type
    });
  }
}