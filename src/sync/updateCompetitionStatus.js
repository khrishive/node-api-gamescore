import { db } from '../db.js'; // Make sure to import your database connection

async function updateCompetitionStatus() {
  const today = Date.now(); // current date in milliseconds

  try {
    // upcoming → not yet started
    await db.execute(
      `UPDATE competitions 
       SET status = 'upcoming' 
       WHERE start_date > ?`,
      [today]
    );

    // ended → already finished
    await db.execute(
      `UPDATE competitions 
       SET status = 'ended' 
       WHERE end_date <= ?`,
      [today]
    );

    // started → already started but not yet finished
    await db.execute(
      `UPDATE competitions 
       SET status = 'started' 
       WHERE start_date <= ? AND end_date > ?`,
      [today, today]
    );

    console.log("✅ Status updated successfully.");
  } catch (error) {
    console.error("❌ Error updating status:", error.message);
  } finally {
    // important: close pool when finished if run as a loose script
    await db.end();
  }
}

// Execute
updateCompetitionStatus();