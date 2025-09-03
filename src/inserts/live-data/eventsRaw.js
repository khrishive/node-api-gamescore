import { db } from '../../db.js';

function isValidRawEvent(event, fixtureId, eventType, timestamp) {
  return (
    event &&
    fixtureId &&
    eventType &&
    timestamp
  );
}

export async function insertRawEvent(event, fixtureId, eventType, timestamp) {
  console.log('Inserting raw event:', { fixtureId, eventType, timestamp });
  if (!isValidRawEvent(event, fixtureId, eventType, timestamp)) {    
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
  } catch (error) {
    return {
      success: false,
      message: 'Error to insert raw event',
      error: error.message
    };
  }
}