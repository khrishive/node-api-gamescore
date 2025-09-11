import { exec } from "child_process";
import { dbCS2, dbLOL } from "../src/db.js";

// Dynamically get sports from db.js exports
const dbConnections = { cs2: dbCS2, lol: dbLOL };
const sports = Object.keys(dbConnections);

async function runAllUpdates() {
  console.log("🚀 Starting to update map breakdowns for all active tournaments across all sports...");

  let executedCount = 0;

  for (const sport of sports) {
    console.log(`
    --- Processing sport: ${sport} ---
  `);

    const command = `node src/middleware/updateActiveTournamentsMapBreakdowns.js ${sport}`;

    await new Promise((resolve, reject) => {
      const process = exec(command);

      process.stdout.on("data", (data) => {
        console.log(data.toString().trim());
      });

      process.stderr.on("data", (data) => {
        console.error(`Error processing ${sport}:`, data.toString().trim());
      });

      process.on("close", (code) => {
        if (code === 0) {
          executedCount++; // Increment count for successful execution
          console.log(`--- Finished processing sport: ${sport} ---
`);
          resolve();
        } else {
          console.error(`--- Script for ${sport} exited with code ${code} ---
`);
          reject(new Error(`Process for ${sport} failed.`));
        }
      });
    });
  }

  console.log(`\n✅ All sports processed successfully!`);
  console.log(`The script has been executed in ${executedCount} database(s).`);
}

runAllUpdates().catch((error) => {
  console.error("\n❌ A global error occurred:", error.message);
  process.exit(1);
});
