
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbCS2, dbLOL } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically get sports from db.js exports
const dbConnections = { cs2: dbCS2, lol: dbLOL };
const sports = Object.keys(dbConnections);

const scriptPath = path.resolve(__dirname, '../inserts/insertCompetitionDescriptionsGeneralAI.js');

function runForSport(sport) {
    return new Promise((resolve, reject) => {
        console.log(`\n--- Processing sport: ${sport} ---`);

        const child = spawn('node', [scriptPath, sport], { stdio: 'inherit' });

        child.on('close', (code) => {
            if (code === 0) {
                console.log(`--- Finished processing sport: ${sport} ---`);
                resolve();
            } else {
                console.error(`--- Error processing ${sport}: Script exited with code ${code} ---`);
                reject(new Error(`Process for ${sport} failed.`));
            }
        });

        child.on('error', (err) => {
            console.error(`--- Failed to start script for ${sport}:`, err);
            reject(err);
        });
    });
}

async function runAllCompetitionDescriptionsAI() {
    console.log("🚀 Starting to generate competition descriptions for all sports...");

    let executedCount = 0;
    const executedDatabases = [];
    let failedCount = 0;
    const failedDatabases = [];

    for (const sport of sports) {
        try {
            await runForSport(sport);
            executedCount++;
            executedDatabases.push(sport);
        } catch (error) {
            failedCount++;
            failedDatabases.push(sport);
            // The error is already logged by runForSport, just continue
        }
    }

    // Final summary
    console.log(`\n
✅ All sports processed!
`);
    console.log(`The script has been executed for ${executedCount} sport(s): ${executedDatabases.join(', ')}`);
    if (failedCount > 0) {
        console.log(`❌ Failed for ${failedCount} sport(s): ${failedDatabases.join(', ')}`);
    }
    console.log("🎉 End of runAllCompetitionDescriptionsAI script.");
}

runAllCompetitionDescriptionsAI().catch((error) => {
  console.error("\n❌ A global error occurred:", error.message);
  process.exit(1);
});
