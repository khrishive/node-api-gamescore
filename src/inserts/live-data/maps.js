import { dbCS2 as db } from '../../db.js';
import mapsLogger from './loggers/mapsLogger.js';

// GSK's map_started/map_ended payloads never include a "status" field —
// the caller derives it from which event fired (see live-data/index.js)
// and passes it in explicitly.
function isValidMapEvent(mapEvent, fixtureId) {
  return (
    mapEvent &&
    typeof mapEvent.mapNumber !== 'undefined' &&
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

  const { mapNumber, mapName = null, status = null } = mapEvent;
  try {
    const [result] = await db.query(`
      INSERT INTO maps (
        fixture_id, map_number, name, status
      ) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = COALESCE(VALUES(name), name),
        status = COALESCE(VALUES(status), status)
    `, [
      fixtureId, mapNumber, mapName, status
    ]);

    // ON DUPLICATE KEY UPDATE reports insertId as 0 when it updated an
    // existing row instead of inserting a new one — look the real id up.
    let mapId = result.insertId;
    if (!mapId) {
      const [rows] = await db.query(
        'SELECT id FROM maps WHERE fixture_id = ? AND map_number = ?',
        [fixtureId, mapNumber]
      );
      mapId = rows[0]?.id ?? null;
    }

    mapsLogger.debug({
      msg: '[insertMap] Map inserted/updated',
      fixtureId, mapNumber, mapName, status, mapId
    });
    return mapId;
  } catch (error) {
    mapsLogger.error({
      msg: '[insertMap] Error inserting/updating map',
      error: error.message,
      mapEvent, fixtureId
    });
    return null;
  }
}