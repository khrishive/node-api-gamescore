//src/utils/dbUtils.js

import { dbCS2, dbLOL, dbDOTA2 } from '../db.js';

export function getDbBySport(sport = 'cs2') {
  console.log(`getDbBySport called with sport: ${sport}`);
  if (sport === 'lol') return dbLOL;
  if (sport === 'dota2') return dbDOTA2;
  return dbCS2; // default to cs2
}
