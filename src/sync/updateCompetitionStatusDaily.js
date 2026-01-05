import { getDbBySport } from '../utils/dbUtils.js'; // Centralized DB selector

export async function updateCompetitionStatus(sport = 'cs2') {
  const db = getDbBySport(sport);
  console.log(`[${sport}] 🚀 Starting competition status update...`);

  try {
    const today = Date.now();

    // --- Step 1: NULL / empty / waiting / upcoming → started ---
    console.log(
      `[${sport}] 1/2: Checking competitions to move to 'started' (null | empty | waiting | upcoming)...`
    );

    const [toStarted] = await db.query(
      `UPDATE competitions
       SET status = 'started'
       WHERE start_date <= ?
         AND (
           status IS NULL
           OR status = ''
           OR status = 'waiting for information'
           OR status = 'upcoming'
         )`,
      [today]
    );

    if (toStarted.affectedRows > 0) {
      console.log(
        `[${sport}] ✅ Updated ${toStarted.affectedRows} competitions to 'started'.`
      );
    } else {
      console.log(
        `[${sport}] ℹ️  No competitions needed to be updated to 'started'.`
      );
    }

    // --- Step 2: started → ended ---
    console.log(
      `[${sport}] 2/2: Checking for 'started' competitions to move to 'ended'...`
    );

    const [startedToEnded] = await db.query(
      `UPDATE competitions
       SET status = 'ended'
       WHERE status = 'started'
         AND end_date <= ?`,
      [today]
    );

    if (startedToEnded.affectedRows > 0) {
      console.log(
        `[${sport}] ✅ Updated ${startedToEnded.affectedRows} competitions from 'started' to 'ended'.`
      );
    } else {
      console.log(
        `[${sport}] ℹ️  No 'started' competitions needed to be updated.`
      );
    }

    console.log(`[${sport}] 🏁 Finished competition status update.`);

  } catch (err) {
    console.error(
      `[${sport}] ❌ Error during competition status update:`,
      err
    );
    throw err;
  }
}

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const sportArg = process.argv[2] || 'cs2';
  updateCompetitionStatus(sportArg).catch(() => process.exit(1));
}
