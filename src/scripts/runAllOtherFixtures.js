import { processFixtures } from '../inserts/insertOnlyOtherFixtures.js';
import { dbCS2, dbLOL } from "../db.js";

// Dynamically get sports from db.js exports
const dbConnections = { cs2: dbCS2, lol: dbLOL };
const sports = Object.keys(dbConnections);

async function runAllOtherFixtures() {
  console.log("🚀 Starting to insert fixtures for all sports...");

  let executedCount = 0;
  const executedDatabases = [];
  let failedCount = 0;
  const failedDatabases = [];

  for (const sport of sports) {
    console.log(`--- Processing sport: ${sport} ---`);
    try {
      await processFixtures(sport);
      executedCount++;
      executedDatabases.push(sport);
      console.log(`--- Finished processing sport: ${sport} ---`);
    } catch (error) {
      failedCount++;
      failedDatabases.push(sport);
      console.error(`--- Error processing ${sport}:`, error.message);
    }
  }

  // Final summary
  console.log(`
✅ All sports processed!`);
  console.log(`The script has been executed ${executedCount} time(s) in the following databases: ${executedDatabases.join(', ')}`);
  if (failedCount > 0) {
    console.log(`❌ Failed in ${failedCount} database(s): ${failedDatabases.join(', ')}`);
  }
  console.log("🎉 End of runAllOtherFixtures script.");
}

runAllOtherFixtures().catch((error) => {
  console.error("\n❌ A global error occurred:", error.message);
  process.exit(1);
});
