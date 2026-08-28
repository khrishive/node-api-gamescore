import { dbCS2 as db } from '../../db.js';
import assistsLogger from './loggers/assistsLogger.js';

// GSK's assist/flash_assist payloads carry no id of their own — only the
// killId of the kill they're attached to. `assists.id` is auto-increment;
// dedup happens via the unique key on (kill_id, assister_id, type).
function isValidAssistEvent(assistEvent, fixtureId, mapId, roundId, type) {
  return (
    assistEvent &&
    assistEvent.killId &&
    assistEvent.assister && assistEvent.assister.id &&
    assistEvent.victim && assistEvent.victim.id &&
    typeof assistEvent.timestamp !== 'undefined' &&
    fixtureId && mapId && roundId && type
  );
}

export async function insertAssist(assistEvent, fixtureId, mapId, roundId, type) {
  assistsLogger.debug({
    msg: '[insertAssist] Data received for insert',
    assistEvent, fixtureId, mapId, roundId, type
  });

  if (!isValidAssistEvent(assistEvent, fixtureId, mapId, roundId, type)) {
    assistsLogger.warn({
      msg: '[insertAssist] Incomplete data, skipping insert',
      assistEvent, fixtureId, mapId, roundId, type
    });
    return;
  }

  const { assister, victim, killId, timestamp } = assistEvent;

  try {
    await db.query(`
      INSERT IGNORE INTO assists (
        round_id, map_id, fixture_id,
        assister_id, assister_team_id,
        victim_id, victim_team_id,
        kill_id, type, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      roundId, mapId, fixtureId,
      assister.id, assister.teamId ?? null,
      victim.id, victim.teamId ?? null,
      killId, type, timestamp
    ]);
    assistsLogger.debug({
      msg: '[insertAssist] Assist inserted',
      roundId, mapId, fixtureId,
      assisterId: assister.id,
      victimId: victim.id,
      killId, type, timestamp
    });
  } catch (error) {
    assistsLogger.error({
      msg: '[insertAssist] Error inserting assist',
      error: error.message,
      assistEvent, fixtureId, mapId, roundId, type
    });
  }
}