//src/scripts/runAllUpdateCompetitionStatusDaily.js

import { updateCompetitionStatus } from '../sync/updateCompetitionStatusDaily.js';
import { dbCS2, dbLOL, dbDOTA2} from "../db.js";

// Dynamically get sports from db.js exports
const dbConnections = {cs2: dbCS2, lol: dbLOL, dota2: dbDOTA2};
const sports = Object.keys(dbConnections);

export async function runAllUpdateCompetitionStatusDaily() {
  console.log("🚀 Starting updateCompetitionStatusDaily for all sports...");

  let executedCount = 0;
  const executedDatabases = [];
  let failedCount = 0;
  const failedDatabases = [];

  for (const sport of sports) {
    console.log(`--- Processing sport: ${sport} ---`);
    try {
      await updateCompetitionStatus(sport);
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
  console.log(`The script has been executed ${executedCount} time(s) in the following databases: ${executedDatabases.join(', ')}`);
  if (failedCount > 0) {
    console.log(`❌ Failed in ${failedCount} database(s): ${failedDatabases.join(', ')}`);
  }
  console.log("🎉 End of runAllUpdateCompetitionStatusDaily script.");
}

runAllUpdateCompetitionStatusDaily().catch((error) => {
  console.error("\n❌ A global error occurred:", error.message);
  // No process.exit(1) needed if this is run by a scheduler
});
