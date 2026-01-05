//src/scripts/runAllInsertMapTeamPlayers.js

import { processMapTeamPlayers } from '../inserts/insertMapTeamPlayers.js';
import { dbCS2 } from "../db.js";

// Dynamically get sports from db.js exports
const dbConnections = { cs2: dbCS2 };
const allSports = Object.keys(dbConnections);

/**
 * Run map_team_players for one sport or all sports
 * @param {string|null} sport
 * @param {string|null} fromDate yyyy-mm-dd
 * @param {string|null} toDate yyyy-mm-dd
 */

export async function runAllInsertMapTeamPlayers(
  sport = null,
  fromDate = null,
  toDate = null
) {
  const sportsToRun = sport ? [sport] : allSports;

  if (sport && !dbConnections[sport]) {
    throw new Error(`Invalid sport "${sport}". Available sports: ${allSports.join(', ')}`);
  }

  console.log(
    sport
      ? `🚀 Starting map_team_players for ${sport}`
      : `🚀 Starting map_team_players for all sports`
  );

  if (fromDate && toDate) {
    console.log(`📅 Date range: ${fromDate} → ${toDate}`);
  }

  let executedCount = 0;
  const executedDatabases = [];
  let failedCount = 0;
  const failedDatabases = [];

  for (const currentSport of sportsToRun) {
    console.log(`--- Processing sport: ${currentSport} ---`);
    try {
      await processMapTeamPlayers(currentSport, fromDate, toDate);
      executedCount++;
      executedDatabases.push(currentSport);
      console.log(`--- Finished processing sport: ${currentSport} ---`);
    } catch (error) {
      failedCount++;
      failedDatabases.push(currentSport);
      console.error(`--- Error processing ${currentSport}:`, error.message);
    }
  }

  console.log(`\n✅ Processing finished!`);
  console.log(`Executed for: ${executedDatabases.join(', ')}`);

  if (failedCount > 0) {
    console.log(`❌ Failed in: ${failedDatabases.join(', ')}`);
  }

  console.log("🎉 End of runAllInsertMapTeamPlayers.");
}

/*
runAllInsertMapTeamPlayers().catch((error) => {
  console.error("\n❌ A global error occurred:", error.message);
  process.exit(1);
});
*/

// CLI support
if (process.argv[1].includes('runAllInsertMapTeamPlayers')) {
  const sportFromCLI = process.argv[2] || null;
  const fromDate = process.argv[3] || null;
  const toDate = process.argv[4] || null;

  runAllInsertMapTeamPlayers(sportFromCLI, fromDate, toDate).catch((error) => {
    console.error("\n❌ A global error occurred:", error.message);
    process.exit(1);
  });
}
