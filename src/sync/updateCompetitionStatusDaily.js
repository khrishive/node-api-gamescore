import { db } from '../db.js'; // Make sure to import your database connection

async function updateCompetitionStatus() {
  try {
    // Current date in seconds (UNIX timestamp * 1000 because your fields are in milliseconds)
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
    db.end(); // close connection when finished
  }
}

updateCompetitionStatus();