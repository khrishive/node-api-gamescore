import { dbCS2, dbLOL } from "../db.js";
import path from "path";
import { exec } from "child_process";

// Dynamically get sports from db.js exports
const dbConnections = { cs2: dbCS2, lol: dbLOL };
const sports = Object.keys(dbConnections);

async function runAllCsMatchEventsCopy() {
  console.log("🚀 Starting csMatchEventsCopy for all sports...");

  let executedCount = 0;
  const executedDatabases = [];
  let failedCount = 0;
  const failedDatabases = [];

  for (const sport of sports) {
    console.log(`--- Processing sport: ${sport} ---`);

    // Use absolute path for reliability
    const scriptPath = path.resolve("src/inserts/csMatchEventsCopy.js");
    const command = `node ${scriptPath} ${sport}`;

    await new Promise((resolve) => {
      const process = exec(command);

      process.stdout.on("data", (data) => {
        const msg = data.toString().trim();
        if (msg !== "") {
          console.log(msg);
        }
      });

      process.stderr.on("data", (data) => {
        console.error(`Error processing ${sport}:`, data.toString().trim());
      });

      process.on("close", (code) => {
        if (code === 0) {
          executedCount++;
          executedDatabases.push(sport);
          console.log(`--- Finished processing sport: ${sport} ---`);
        } else {
          failedCount++;
          failedDatabases.push(sport);
          console.error(`--- Script for ${sport} exited with code ${code} ---`);
        }
        resolve();
      });
    });
  }

  // Final summary
  console.log(`\n✅ All sports processed!`);
  console.log(`The script has been executed ${executedCount} time(s) in the following databases: ${executedDatabases.join(', ')}`);
  if (failedCount > 0) {
    console.log(`❌ Failed in ${failedCount} database(s): ${failedDatabases.join(', ')}`);
  }
  console.log("🎉 End of runAllCsMatchEventsCopy script.");
}

runAllCsMatchEventsCopy().catch((error) => {
  console.error("\n❌ A global error occurred:", error.message);
  process.exit(1);
});