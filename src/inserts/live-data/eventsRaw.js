import { db } from '../../db.js';
import eventsRawLogger from './loggers/evenRawLogger.js';

function isValidRawEvent(event, fixtureId, eventType, timestamp) {
  return (
    event &&
    fixtureId &&
    eventType &&
    timestamp
  );
}

export async function insertRawEvent(event, fixtureId, eventType, timestamp) {
  eventsRawLogger.debug({
    msg: '[insertRawEvent] Datos recibidos para insert',
    event, fixtureId, eventType, timestamp
  });

  if (!isValidRawEvent(event, fixtureId, eventType, timestamp)) {
    eventsRawLogger.warn({
      msg: '[insertRawEvent] Datos incompletos, se omite insert',
      event, fixtureId, eventType, timestamp
    });
    return;
  }
  try {
    await db.query(`
      INSERT IGNORE INTO events_raw (
        fixture_id, event_type, event_json, timestamp
      ) VALUES (?, ?, ?, ?)
    `, [
      fixtureId, eventType, JSON.stringify(event), timestamp
    ]);
    eventsRawLogger.debug({
      msg: '[insertRawEvent] Raw event insertado',
      fixtureId, eventType, timestamp
    });
  } catch (error) {
    eventsRawLogger.error({
      msg: '[insertRawEvent] Error al insertar raw event',
      error: error.message,
      event, fixtureId, eventType, timestamp
    });
  }
}