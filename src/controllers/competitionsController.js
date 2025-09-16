import { getDbBySport } from '../utils/dbUtils.js';

export const getCompetitions = async (offset = 0, limit = 100, filters = {}, sport = 'cs2') => {
  const db = getDbBySport(sport);
  let query = `SELECT * FROM competitions`;
  const params = [];
  const conditions = [];

  // Flexible date filtering
  if (filters.customRange) {
    const { from, to } = filters.customRange;
    if (from && to) {
      const fromTimestamp = new Date(from).getTime();
      const toTimestamp = new Date(`${to}T23:59:59Z`).getTime();
      conditions.push(`start_date BETWEEN ? AND ?`);
      params.push(fromTimestamp, toTimestamp);
    }
  } else if (filters.start_date && filters.end_date) {
    const fromTimestamp = new Date(filters.start_date).getTime();
    const toTimestamp = new Date(`${filters.end_date}T23:59:59Z`).getTime();
    conditions.push(`start_date BETWEEN ? AND ?`);
    params.push(fromTimestamp, toTimestamp);
  } else if (filters.start_date) {
    const fromTimestamp = new Date(filters.start_date).getTime();
    conditions.push(`start_date >= ?`);
    params.push(fromTimestamp);
  } else if (filters.end_date) {
    const toTimestamp = new Date(`${filters.end_date}T23:59:59Z`).getTime();
    conditions.push(`start_date <= ?`);
    params.push(toTimestamp);
  }

  // All other optional filters except updated_at and sport_alias (merged with sport)
  const filterFields = [
    'id', 'name', 'prize_pool_usd',
    'location', 'organizer', 'type', 'fixture_count', 'description',
    'no_participants', 'stage', 'time_of_year', 'year', 'series', 'tier'
  ];

  for (const field of filterFields) {
    if (filters[field] !== undefined) {
      if (field === "name" || field === "location" || field === "organizer" || field === "description" || field === "series") {
        conditions.push(`\`${field}\` LIKE ?`);
        params.push(`%${filters[field]}%`);
      } else {
        conditions.push(`\`${field}\` = ?`);
        params.push(filters[field]);
      }
    }
  }

  // Always filter by sport_alias using sport value
  if (sport) {
    conditions.push('sport_alias = ?');
    params.push(sport);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY updated_at DESC`;

  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 100;
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;

  query += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;

  const [rows] = await db.execute(query, params);
  return rows;
};
