import { processFixtures } from '../inserts/insertOnlyOtherFixtures.js';
import { dbCS2, dbLOL } from "../db.js";
import {processMapTeamPlayers} from '../inserts/inserLolMapStats.js';
import {processLolPickBan} from '../inserts/insertLolPickBan.js';
import {processLolPlayersBuild} from '../inserts/inserLolPlayersBuild.js';

// Dynamically get sports from db.js exports
const dbConnections = { cs2: dbCS2, lol: dbLOL };
const sports = Object.keys(dbConnections);

async function runAllOtherFixtures() {
  console.log("🚀 Starting to insert fixtures for all sports...");

  let executedCount = 0;
  const executedDatabases = [];
  let failedCount = 0;
  const failedDatabases = [];

  // 👇 Aquí guardaremos los IDs procesados por cada deporte
  const allProcessedFixtures = {};

  for (const sport of sports) {
    console.log(`--- Processing sport: ${sport} ---`);
    try {
      const processedIds = await processFixtures(sport); // 👈 Guardamos el resultado aquí
      allProcessedFixtures[sport] = processedIds; // lo guardamos por deporte

      executedCount++;
      executedDatabases.push(sport);
      console.log(`--- Finished processing sport: ${sport}, ${processedIds.length} fixtures processed ---`);
    } catch (error) {
      failedCount++;
      failedDatabases.push(sport);
      console.error(`--- Error processing ${sport}:`, error.message);
    }
  }

  // ✅ Ahora puedes usar `allProcessedFixtures` para otra función
  console.log("\n📦 All processed fixture IDs by sport:");
  console.log(allProcessedFixtures);

  // 👉 Ejemplo: pasar los IDs a otra función
  await nextStep(allProcessedFixtures);

  // Final summary
  console.log(`
✅ All sports processed!`);
  console.log(`The script has been executed ${executedCount} time(s) in the following databases: ${executedDatabases.join(', ')}`);
  if (failedCount > 0) {
    console.log(`❌ Failed in ${failedCount} database(s): ${failedDatabases.join(', ')}`);
  }
  console.log("🎉 End of runAllOtherFixtures script.");
}

/**
 * 🔁 Ejemplo de función que recibe los IDs procesados
 */
async function nextStep(allProcessedFixtures) {
  // Procesamos solo 'lol' una vez
  if (allProcessedFixtures.lol && allProcessedFixtures.lol.length > 0) {
    console.log(`🎯 Starting map/team player processing for LOL (${allProcessedFixtures.lol.length} fixtures)...`);

    // inserting map team players
    try {
      await processMapTeamPlayers('lol', allProcessedFixtures);
      console.log('✅ Map/team player processing for LOL completed.');
    } catch (err) {
      console.error('❌ Error processing LOL map/team players:', err.message);
    }

    // inserting pick/ban data
    try {
      await processLolPickBan('lol', allProcessedFixtures);
      console.log('✅ Map/team player processing for LOL completed.');
    } catch (err) {
      console.error('❌ Error processing LOL map/team players:', err.message);
    }

    //inserting players build data
    try {
      await processLolPlayersBuild('lol', allProcessedFixtures);
      console.log('✅ Players build processing for LOL completed.');
    } catch (err) {
      console.error('❌ Error processing LOL players build:', err.message);
    }



  } else {
    console.log('⚠️ No LOL fixture IDs found to process.');
  }
}


runAllOtherFixtures().catch((error) => {
  console.error("\n❌ A global error occurred:", error.message);
  process.exit(1);
});
