import { db } from '../../db.js';
import mapsLogger from './loggers/mapsLogger.js';

function isValidMapEvent(mapEvent, fixtureId) {
  return (
    mapEvent &&
    typeof mapEvent.mapNumber !== 'undefined' &&
    typeof mapEvent.mapName !== 'undefined' &&
    typeof mapEvent.status !== 'undefined' &&
    fixtureId
  );
}

export async function insertMap(mapEvent, fixtureId) {
  mapsLogger.debug({
    msg: '[insertMap] Data received for insert',
    mapEvent, fixtureId
  });

  if (!isValidMapEvent(mapEvent, fixtureId)) {
    mapsLogger.warn({
      msg: '[insertMap] Incomplete data, skipping insert',
      mapEvent, fixtureId
    });
    return null;
  }

  const { mapNumber, mapName, status } = mapEvent;
  try {
    const [result] = await db.query(`
      INSERT INTO maps (
        fixture_id, map_number, name, status
      ) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status)
    `, [
      fixtureId, mapNumber, mapName, status
    ]);
    mapsLogger.debug({
      msg: '[insertMap] Map inserted/updated',
      fixtureId, mapNumber, mapName, status, insertId: result.insertId
    });
    return result.insertId;
  } catch (error) {
    mapsLogger.error({
      msg: '[insertMap] Error inserting/updating map',
      error: error.message,
      mapEvent, fixtureId
    });
    return null;
  }
}