import { db } from '../../db.js';
import roundsLogger from './loggers/roundsLogger.js';

function isValidRoundEvent(roundEvent, mapId, fixtureId) {
  return (
    roundEvent &&
    typeof roundEvent.roundNumber !== 'undefined' &&
    typeof roundEvent.halfNumber !== 'undefined' &&
    typeof roundEvent.winnerId !== 'undefined' &&
    typeof roundEvent.winCondition !== 'undefined' &&
    mapId &&
    fixtureId // Now also validates fixtureId
  );
}

export async function insertRound(roundEvent, mapId, fixtureId) {
  roundsLogger.debug({
    msg: '[insertRound] Data received for insert',
    roundEvent, mapId, fixtureId
  });

  if (!isValidRoundEvent(roundEvent, mapId, fixtureId)) {
    roundsLogger.warn({
      msg: '[insertRound] Incomplete data, skipping insert',
      roundEvent, mapId, fixtureId
    });
    return null;
  }

  const { roundNumber, halfNumber, winnerId, winCondition } = roundEvent;
  try {
    const [result] = await db.query(`
      INSERT IGNORE INTO rounds (
        fixture_id, map_id, round_number, half_number, winner_team_id, win_condition
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      fixtureId, mapId, roundNumber, halfNumber, winnerId, winCondition
    ]);
    roundsLogger.debug({
      msg: '[insertRound] Round inserted',
      fixtureId, mapId, roundNumber, halfNumber, winnerId, winCondition, insertId: result.insertId
    });
    return result.insertId;
  } catch (error) {
    roundsLogger.error({
      msg: '[insertRound] Error inserting round',
      error: error.message,
      roundEvent, mapId, fixtureId
    });
    return null;
  }
}