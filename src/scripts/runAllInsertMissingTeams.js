//src/scripts/runAllInsertMissingTeams.js
import { processMissingTeams } from '../inserts/insertMissingTeams.js';
import { dbCS2, dbLOL, dbDOTA2 } from "../db.js";

// Available DB connections
const dbConnections = { cs2: dbCS2, lol: dbLOL, dota2: dbDOTA2 };
const ALL_SPORTS = Object.keys(dbConnections);

export async function runAllInsertMissingTeams(sp = null) {
  const sportsToRun = sp ? [sp] : ALL_SPORTS;

  console.log(`🚀 Starting to insert missing teams for: ${sportsToRun.join(', ')}`);

  let executedCount = 0;
  const executedDatabases = [];
  let failedCount = 0;
  const failedDatabases = [];

  for (const sport of sportsToRun) {
    console.log(`--- Processing sport: ${sport} ---`);
    try {
      await processMissingTeams(sport);
      executedCount++;
      executedDatabases.push(sport);
      console.log(`--- Finished processing sport: ${sport} ---`);
    } catch (error) {
      failedCount++;
      failedDatabases.push(sport);
      console.error(`--- Error processing ${sport}:`, error.message);
    }
  }

  console.log(`\n✅ All sports processed!`);
  console.log(
    `The script has been executed ${executedCount} time(s) in: ${executedDatabases.join(', ')}`
  );

  if (failedCount > 0) {
    console.log(`❌ Failed in ${failedCount} database(s): ${failedDatabases.join(', ')}`);
  }

  console.log("🎉 End of runAllInsertMissingTeams script.");
}

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const sport = process.argv[2] || null;

  runAllInsertMissingTeams(sport).catch((error) => {
    console.error("\n❌ A global error occurred:", error.message);
    process.exit(1);
  });
}
