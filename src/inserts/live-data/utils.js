import { dbCS2 as db } from '../../db.js';
import utilsLogger from './loggers/utilsLogger.js';

// Insert a bare-minimum player row if it doesn't exist yet. Real profile data
// (first_name, country, etc.) is filled in separately by
// insertMissingTeamsAndPlayers.js — this is only a safety net so a kill/assist
// referencing a brand-new player id doesn't leave it completely unknown.
// INSERT IGNORE never overwrites an existing (richer) row.
export async function ensurePlayerExists(player) {
  utilsLogger.debug({
    msg: '[ensurePlayerExists] Data received for insert',
    player
  });

  if (!player || !player.id) {
    utilsLogger.warn({
      msg: '[ensurePlayerExists] Invalid player, skipping insert',
      player
    });
    return;
  }
  try {
    await db.query(`
      INSERT IGNORE INTO player (id, nickname)
      VALUES (?, ?)
    `, [player.id, player.name || player.nickname || null]);
    utilsLogger.debug({
      msg: '[ensurePlayerExists] Player inserted or already exists',
      playerId: player.id,
      nickname: player.name || player.nickname || null
    });
  } catch (error) {
    utilsLogger.error({
      msg: '[ensurePlayerExists] Error inserting player',
      error: error.message,
      player
    });
  }
}

// Insert a team if it does not exist
export async function ensureTeamExists(teamId, teamName) {
  utilsLogger.debug({
    msg: '[ensureTeamExists] Data received for insert',
    teamId, teamName
  });

  if (!teamId) {
    utilsLogger.warn({
      msg: '[ensureTeamExists] Invalid teamId, skipping insert',
      teamId, teamName
    });
    return;
  }
  try {
    await db.query(`
      INSERT IGNORE INTO participants (id, name)
      VALUES (?, ?)
    `, [teamId, teamName || null]);
    utilsLogger.debug({
      msg: '[ensureTeamExists] Team inserted or already exists',
      teamId,
      teamName: teamName || null
    });
  } catch (error) {
    utilsLogger.error({
      msg: '[ensureTeamExists] Error inserting team',
      error: error.message,
      teamId, teamName
    });
  }
}