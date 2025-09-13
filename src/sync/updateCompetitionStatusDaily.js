import { getDbBySport } from '../utils/dbUtils.js'; // Centralized DB selector

export async function updateCompetitionStatus(sport = 'cs2') {
  const db = getDbBySport(sport); // Use the correct DB connection
  console.log(`🚀 Starting competition status update for ${sport}...`);

  try {
    // Current date in milliseconds
    const today = Date.now();

    // 1️⃣ Update upcoming → started
    const [upcomingToStarted] = await db.query(
      `UPDATE competitions 
       SET status = 'started' 
       WHERE status = 'upcoming' 
         AND start_date <= ?`,
      [today]
    );

    if (upcomingToStarted.affectedRows > 0) {
        console.log(`✅ Competitions updated to started in ${sport}: ${upcomingToStarted.affectedRows}`);
    }

    // 2️⃣ Update started → ended
    const [startedToEnded] = await db.query(
      `UPDATE competitions 
       SET status = 'ended' 
       WHERE status = 'started' 
         AND end_date <= ?`,
      [today]
    );

    if (startedToEnded.affectedRows > 0) {
        console.log(`✅ Competitions updated to ended in ${sport}: ${startedToEnded.affectedRows}`);
    }

    console.log(`🏁 Finished competition status update for ${sport}.`);

  } catch (err) {
    console.error(`❌ Error updating competitions for ${sport}:`, err);
  } finally {
    // The connection pool should not be ended here to allow reuse.
    // await db.end();
  }
}

// If run directly, execute with CLI arguments
if (import.meta.url === `file://${process.argv[1]}`) {
  const sportArg = process.argv[2] || 'cs2';
  updateCompetitionStatus(sportArg).catch(err => {
    console.error("Error during direct execution:", err);
    process.exit(1);
  });
}
