import { getDbBySport } from './src/utils/dbUtils.js';

export async function getParticipantById({
  id,
  sport = 'cs2'
}) {
  const db = getDbBySport(sport);

  try {
    const [rows] = await db.query(
      `
      SELECT *
      FROM participants
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      console.log(`❌ Participant not found | id=${id} | sport=${sport}`);
      return null;
    }

    console.log('✅ Participant found:');
    console.log(rows[0]);

    return rows[0];

  } catch (error) {
    console.error('❌ Error fetching participant:', error.message);
    throw error;
  }
}
