//src/scripts/runAllOtherFixtures.js
import { processFixtures } from '../inserts/insertOnlyOtherFixtures.js';
import { dbCS2, dbLOL, dbDOTA2 } from "../db.js";
import { processMapTeamPlayers } from '../inserts/inserLolMapStats.js';
import { processLolPickBan } from '../inserts/insertLolPickBan.js';
import { processLolPlayersBuild } from '../inserts/inserLolPlayersBuild.js';

// Available DB connections
const dbConnections = { cs2: dbCS2, lol: dbLOL, dota2: dbDOTA2 };
const ALL_SPORTS = Object.keys(dbConnections);

export async function runAllOtherFixtures(sp = null) {
  const sportsToRun = sp ? [sp] : ALL_SPORTS;

  console.log(`🚀 Starting to insert fixtures for: ${sportsToRun.join(', ')}`);

  let executedCount = 0;
  const executedDatabases = [];
  let failedCount = 0;
  const failedDatabases = [];

  const allProcessedFixtures = {};

  for (const sport of sportsToRun) {
    console.log(`--- Processing sport: ${sport} ---`);
    try {
      const processedIds = await processFixtures(sport);

      allProcessedFixtures[sport] = processedIds;
      executedCount++;
      executedDatabases.push(sport);

      console.log(
        `--- Finished processing sport: ${sport}, ${processedIds.length} fixtures processed ---`
      );
    } catch (error) {
      failedCount++;
      failedDatabases.push(sport);
      console.error(`--- Error processing ${sport}:`, error.message);
    }
  }

  console.log("\n📦 All processed fixture IDs by sport:");
  console.log(allProcessedFixtures);

  await nextStep(allProcessedFixtures);

  console.log(`\n✅ All sports processed!`);
  console.log(
    `The script has been executed ${executedCount} time(s) in: ${executedDatabases.join(', ')}`
  );

  if (failedCount > 0) {
    console.log(`❌ Failed in ${failedCount} database(s): ${failedDatabases.join(', ')}`);
  }

  console.log("🎉 End of runAllOtherFixtures script.");
}


// 🔁 Post-processing (LOL + DOTA2 maps)
async function nextStep(allProcessedFixtures) {
  const SPORTS_WITH_MAPS = ['lol', 'dota2'];

  for (const sport of SPORTS_WITH_MAPS) {
    const fixtureIds = allProcessedFixtures[sport];

    if (!Array.isArray(fixtureIds) || fixtureIds.length === 0) {
      console.log(`⚠️ No ${sport.toUpperCase()} fixture IDs found. Skipping post-processing.`);
      continue;
    }

    console.log(
      `\n🎯 Post-processing ${sport.toUpperCase()} (${fixtureIds.length} fixtures)`
    );

    // 🗺️ Map / Team Players
    try {
      await processMapTeamPlayers(sport, allProcessedFixtures);
      console.log(`✅ Map/team players processed for ${sport.toUpperCase()}`);
    } catch (err) {
      console.error(
        `❌ Map/team players failed for ${sport.toUpperCase()}:`,
        err.message
      );
    }

    // 🟦 Pick / Ban
    try {
      await processLolPickBan(sport, allProcessedFixtures);
      console.log(`✅ Pick/Ban processed for ${sport.toUpperCase()}`);
    } catch (err) {
      console.error(
        `❌ Pick/Ban failed for ${sport.toUpperCase()}:`,
        err.message
      );
    }

    // 🧩 Players Build (NOW MULTI-SPORT)
    try {
      await processLolPlayersBuild(sport, allProcessedFixtures);
      console.log(`✅ Players build processed for ${sport.toUpperCase()}`);
    } catch (err) {
      console.error(
        `❌ Players build failed for ${sport.toUpperCase()}:`,
        err.message
      );
    }
  }
}



// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const sport = process.argv[2] || null;

  runAllOtherFixtures(sport).catch((error) => {
    console.error("\n❌ A global error occurred:", error.message);
    process.exit(1);
  });
}
