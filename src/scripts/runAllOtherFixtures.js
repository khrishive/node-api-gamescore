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
  for (const [sport, fixtureIds] of Object.entries(allProcessedFixtures)) {
    console.log(`⚙️ ${sport}: received ${fixtureIds.length} processed fixture IDs`);
    // Aquí puedes hacer lo que necesites con esos IDs
    // Por ejemplo, actualizar estadísticas, llamar otra API, etc.
  }
}

runAllOtherFixtures().catch((error) => {
  console.error("\n❌ A global error occurred:", error.message);
  process.exit(1);
});
