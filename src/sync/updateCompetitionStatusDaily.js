import { getDbBySport } from '../utils/dbUtils.js'; // Centralized DB selector

// Get sport from command line argument, default to 'cs2'
const sport = process.argv[2] || 'cs2';

async function updateCompetitionStatus() {
  const db = getDbBySport(sport); // Use the correct DB connection

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

    console.log(`✅ Competitions updated to started: ${upcomingToStarted.affectedRows}`);

    // 2️⃣ Update started → ended
    const [startedToEnded] = await db.query(
      `UPDATE competitions 
       SET status = 'ended' 
       WHERE status = 'started' 
         AND end_date <= ?`,
      [today]
    );

    console.log(`✅ Competitions updated to ended: ${startedToEnded.affectedRows}`);

  } catch (err) {
    console.error('❌ Error updating competitions:', err);
  } finally {
    await db.end(); // close connection when finished
  }
}

updateCompetitionStatus();