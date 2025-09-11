import { db } from '../../db.js';
import KillsLogger from './loggers/KillsLogger.js';

function isValidKillEvent(killEvent, fixtureId, mapId, roundId) {
  return (
    killEvent &&
    killEvent.killId &&
    killEvent.killer && killEvent.killer.id && killEvent.killer.teamId &&
    killEvent.victim && killEvent.victim.id && killEvent.victim.teamId &&
    typeof killEvent.weapon !== 'undefined' &&
    typeof killEvent.headshot !== 'undefined' &&
    typeof killEvent.penetrated !== 'undefined' &&
    typeof killEvent.noScope !== 'undefined' &&
    typeof killEvent.throughSmoke !== 'undefined' &&
    typeof killEvent.whileBlinded !== 'undefined' &&
    killEvent.timestamp &&
    fixtureId && mapId && roundId
  );
}

export async function insertKill(killEvent, fixtureId, mapId, roundId) {
  KillsLogger.debug({
    msg: '[insertKill] Data received for insert',
    killEvent, fixtureId, mapId, roundId
  });

  if (!isValidKillEvent(killEvent, fixtureId, mapId, roundId)) {
    KillsLogger.warn({
      msg: '[insertKill] Incomplete data, skipping insert',
      killEvent, fixtureId, mapId, roundId
    });
    return;
  }

  const {
    killId, killer, victim, weapon, headshot, penetrated,
    noScope, throughSmoke, whileBlinded, timestamp
  } = killEvent;

  try {
    await db.query(`
      INSERT IGNORE INTO kills (
        id, round_id, map_id, fixture_id,
        killer_id, killer_team_id,
        victim_id, victim_team_id,
        weapon, headshot, penetrated, no_scope,
        through_smoke, while_blinded, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      killId, roundId, mapId, fixtureId,
      killer.id, killer.teamId,
      victim.id, victim.teamId,
      weapon, headshot, penetrated, noScope,
      throughSmoke, whileBlinded, timestamp
    ]);
    KillsLogger.debug({
      msg: '[insertKill] Kill inserted',
      killId, roundId, mapId, fixtureId,
      killerId: killer.id,
      victimId: victim.id,
      weapon, headshot, penetrated, noScope,
      throughSmoke, whileBlinded, timestamp
    });
  } catch (error) {
    KillsLogger.error({
      msg: '[insertKill] Error inserting kill',
      error: error.message,
      killEvent, fixtureId, mapId, roundId
    });
  }
}