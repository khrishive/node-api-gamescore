import { db } from '../../db.js';
import utilsLogger from './loggers/utilsLogger.js';

// Inserta un player si no existe
export async function ensurePlayerExists(player) {
  utilsLogger.debug({
    msg: '[ensurePlayerExists] Datos recibidos para insert',
    player
  });

  if (!player || !player.id) {
    utilsLogger.warn({
      msg: '[ensurePlayerExists] Player inválido, se omite insert',
      player
    });
    return;
  }
  try {
    await db.query(`
      INSERT IGNORE INTO players (id, nickname)
      VALUES (?, ?)
    `, [player.id, player.name || player.nickname || null]);
    utilsLogger.debug({
      msg: '[ensurePlayerExists] Player insertado o ya existente',
      playerId: player.id,
      nickname: player.name || player.nickname || null
    });
  } catch (error) {
    utilsLogger.error({
      msg: '[ensurePlayerExists] Error al insertar player',
      error: error.message,
      player
    });
  }
}

// Inserta un equipo si no existe
export async function ensureTeamExists(teamId, teamName) {
  utilsLogger.debug({
    msg: '[ensureTeamExists] Datos recibidos para insert',
    teamId, teamName
  });

  if (!teamId) {
    utilsLogger.warn({
      msg: '[ensureTeamExists] teamId inválido, se omite insert',
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
      msg: '[ensureTeamExists] Equipo insertado o ya existente',
      teamId,
      teamName: teamName || null
    });
  } catch (error) {
    utilsLogger.error({
      msg: '[ensureTeamExists] Error al insertar equipo',
      error: error.message,
      teamId, teamName
    });
  }
}