import { dbCS2 as db } from '../../db.js';
import roundsLogger from './loggers/roundsLogger.js';

// Called twice per round: once on round_started (no winner yet — kills/assists
// need a real round_id to attach to while the round is in progress) and once
// on round_ended (fills in winner_team_id/win_condition). Both calls upsert
// on (fixture_id, map_id, round_number), so either order/a missed
// round_started is tolerated.
function isValidRoundEvent(roundEvent, mapId, fixtureId) {
  return (
    roundEvent &&
    typeof roundEvent.roundNumber !== 'undefined' &&
    mapId &&
    fixtureId
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

  const {
    roundNumber,
    halfNumber = null,
    winnerId = null,
    winCondition = null
  } = roundEvent;

  try {
    const [result] = await db.query(`
      INSERT INTO rounds (
        fixture_id, map_id, round_number, half_number, winner_team_id, win_condition
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        half_number = COALESCE(VALUES(half_number), half_number),
        winner_team_id = COALESCE(VALUES(winner_team_id), winner_team_id),
        win_condition = COALESCE(VALUES(win_condition), win_condition)
    `, [
      fixtureId, mapId, roundNumber, halfNumber, winnerId, winCondition
    ]);

    // insertId comes back as 0 when this updated an existing row (e.g. the
    // round_ended call, after round_started already created it) — resolve
    // the real id in that case.
    let roundId = result.insertId;
    if (!roundId) {
      const [rows] = await db.query(
        'SELECT id FROM rounds WHERE fixture_id = ? AND map_id = ? AND round_number = ?',
        [fixtureId, mapId, roundNumber]
      );
      roundId = rows[0]?.id ?? null;
    }

    roundsLogger.debug({
      msg: '[insertRound] Round inserted/updated',
      fixtureId, mapId, roundNumber, halfNumber, winnerId, winCondition, roundId
    });
    return roundId;
  } catch (error) {
    roundsLogger.error({
      msg: '[insertRound] Error inserting round',
      error: error.message,
      roundEvent, mapId, fixtureId
    });
    return null;
  }
}