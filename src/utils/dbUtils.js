import { dbCS2, dbLOL } from '../db.js';

export function getDbBySport(sport = 'cs2') {
  console.log(`getDbBySport called with sport: ${sport}`);
  if (sport === 'lol') return dbLOL;
  return dbCS2; // default to cs2
}
