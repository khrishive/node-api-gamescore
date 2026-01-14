//src/scripts/runAllInsertCompetitions.js

import { getAndSaveCompetitions } from '../inserts/insertCompetitions.js';
import { dbCS2, dbLOL, dbDOTA2 } from "../db.js";

// Available DB connections
const dbConnections = {
  cs2: dbCS2,
  lol: dbLOL,
  dota2: dbDOTA2
};

const allSports = Object.keys(dbConnections);

/**
 * Run insert competitions for one sport or all sports
 * @param {string|null} sport
 * @param {string|null} fromDate yyyy-mm-dd
 * @param {string|null} toDate yyyy-mm-dd
 */
export async function runAllInsertCompetitions(
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
      ? `🚀 Starting competitions for ${sport}`
      : `🚀 Starting competitions for all sports`
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
      await getAndSaveCompetitions(currentSport, fromDate, toDate);
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

  console.log("🎉 End of runAllInsertCompetitions.");
}

/**
 * CLI usage:
 * node runAllInsertCompetitions.js
 * node runAllInsertCompetitions.js dota2
 * node runAllInsertCompetitions.js dota2 2025-01-01 2025-12-31
 */
if (process.argv[1].includes('runAllInsertCompetitions')) {
  const sportFromCLI = process.argv[2] || null;
  let fromDate = process.argv[3] || null;
  let toDate = process.argv[4] || null;

  // Set default dates if not provided
  if (!fromDate || !toDate) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    fromDate = `${currentYear}-01-01`;

    // If November (10) or December (11), set toDate to next year
    if (currentMonth >= 10) {
      toDate = `${currentYear + 1}-12-31`;
    } else {
      toDate = `${currentYear}-12-31`;
    }

    console.log(`📅 Default dates applied: ${fromDate} → ${toDate}`);
  }

  runAllInsertCompetitions(sportFromCLI, fromDate, toDate).catch((error) => {
    console.error("\n❌ A global error occurred:", error.message);
    process.exit(1);
  });
}
