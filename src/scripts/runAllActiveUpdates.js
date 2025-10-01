import { updateActiveMapBreakdowns } from '../middleware/updateActiveTournamentsMapBreakdowns.js';
import { dbCS2, dbLOL } from "../db.js";

// Dynamically get sports from db.js exports
const dbConnections = { cs2: dbCS2, lol: dbLOL };
const sports = Object.keys(dbConnections);

async function runAllUpdates() {
  console.log("🚀 Starting to update map breakdowns for all active tournaments across all sports...");

  let executedCount = 0;
  const executedDatabases = [];
  let failedCount = 0;
  const failedDatabases = [];

  for (const sport of sports) {
    console.log(`--- Processing sport: ${sport} ---`);
    try {
      await updateActiveMapBreakdowns(sport);
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
  console.log("🎉 End of runAllActiveUpdates script.");
}

runAllUpdates().catch((error) => {
  console.error("\n❌ A global error occurred:", error.message);
  process.exit(1);
});