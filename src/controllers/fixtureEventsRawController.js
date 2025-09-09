import { dbCS2, dbLOL } from '../db.js';

// Helper to get the correct DB pool based on sport
function getDbBySport(sport = 'cs2') {
  if (sport === 'lol') return dbLOL;
  return dbCS2;
}

export async function getFixtureEventsRaw(fixtureId, sport = 'cs2') {
  const db = getDbBySport(sport);

  // 1. Obtener los eventos crudos
  const [eventsRaw] = await db.query(`
    SELECT 
      id,
      fixture_id,
      event_type,
      event_json,
      timestamp
    FROM events_raw
    WHERE fixture_id = ?
    ORDER BY timestamp, id
  `, [fixtureId]);

  // Si no hay eventos, responde null
  if (!eventsRaw.length) return null;

  // 2. Resumen: cuenta de tipos de eventos
  const eventTypeCounts = {};
  eventsRaw.forEach(e => {
    if (!eventTypeCounts[e.event_type]) {
      eventTypeCounts[e.event_type] = 0;
    }
    eventTypeCounts[e.event_type]++;
  });

  return {
    fixtureId,
    eventsRaw,
    eventTypeCounts
  };
}