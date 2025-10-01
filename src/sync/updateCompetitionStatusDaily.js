import { getDbBySport } from '../utils/dbUtils.js'; // Centralized DB selector

export async function updateCompetitionStatus(sport = 'cs2') {
  const db = getDbBySport(sport); // Use the correct DB connection
  console.log(`[${sport}] 🚀 Starting competition status update...`);

  try {
    // Current date in milliseconds
    const today = Date.now();

    // --- Step 1: Update upcoming → started ---
    console.log(`[${sport}] 1/2: Checking for 'upcoming' competitions to move to 'started'...`);
    const [upcomingToStarted] = await db.query(
      `UPDATE competitions 
       SET status = 'started' 
       WHERE status = 'upcoming' 
         AND start_date <= ?`,
      [today]
    );

    if (upcomingToStarted.affectedRows > 0) {
      console.log(`[${sport}] ✅ Updated ${upcomingToStarted.affectedRows} competitions from 'upcoming' to 'started'.`);
    } else {
      console.log(`[${sport}] ℹ️  No 'upcoming' competitions needed to be updated.`);
    }

    // --- Step 2: Update started → ended ---
    console.log(`[${sport}] 2/2: Checking for 'started' competitions to move to 'ended'...`);
    const [startedToEnded] = await db.query(
      `UPDATE competitions 
       SET status = 'ended' 
       WHERE status = 'started' 
         AND end_date <= ?`,
      [today]
    );

    if (startedToEnded.affectedRows > 0) {
      console.log(`[${sport}] ✅ Updated ${startedToEnded.affectedRows} competitions from 'started' to 'ended'.`);
    } else {
      console.log(`[${sport}] ℹ️  No 'started' competitions needed to be updated.`);
    }

    console.log(`[${sport}] 🏁 Finished competition status update.`);

  } catch (err) {
    console.error(`[${sport}] ❌ Error during competition status update:`, err);
    throw err; // Re-throw the error so the runner script can catch it
  } finally {
    // The connection pool should not be ended here to allow reuse.
  }
}

// If run directly, execute with CLI arguments
if (import.meta.url === `file://${process.argv[1]}`) {
  const sportArg = process.argv[2] || 'cs2';
  updateCompetitionStatus(sportArg).catch(err => {
    // Error is already logged in the function, just exit
    process.exit(1);
  });
}