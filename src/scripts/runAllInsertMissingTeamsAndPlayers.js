// src/scripts/runAllInsertMissingTeamsAndPlayers.js

import { processMissingTeamsAndPlayers } from '../inserts/insertMissingTeamsAndPlayers.js';
import { dbCS2, dbLOL, dbDOTA2 } from "../db.js";

// Dynamically get sports from db.js exports
const dbConnections = {
  cs2: dbCS2, 
  lol: dbLOL,
  dota2: dbDOTA2
};

const sports = Object.keys(dbConnections);

export async function runAllInsertMissingTeamsAndPlayers(sp = null) {
  console.log("🚀 Starting to insert missing teams and players...");

  const sportsToRun = sp ? [sp] : sports;

  let executedCount = 0;
  const executedDatabases = [];
  let failedCount = 0;
  const failedDatabases = [];

  for (const sport of sportsToRun) {
    console.log(`--- Processing sport: ${sport} ---`);
    try {
      await processMissingTeamsAndPlayers(sport);
      executedCount++;
      executedDatabases.push(sport);
      console.log(`--- Finished processing sport: ${sport} ---`);
    } catch (error) {
      failedCount++;
      failedDatabases.push(sport);
      console.error(`--- Error processing ${sport}:`, error.message);
    }
  }

  console.log(`\n✅ Process finished!`);
  console.log(`Executed ${executedCount} time(s) for: ${executedDatabases.join(', ')}`);
  if (failedCount > 0) {
    console.log(`❌ Failed in ${failedCount} database(s): ${failedDatabases.join(', ')}`);
  }
  console.log("🎉 End of runAllInsertMissingTeamsAndPlayers script.");
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const sportArg = process.argv[2] || null;

  runAllInsertMissingTeamsAndPlayers(sportArg).catch((error) => {
    console.error("\n❌ A global error occurred:", error.message);
    process.exit(1);
  });
}
