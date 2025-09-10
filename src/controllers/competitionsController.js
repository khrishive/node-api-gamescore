import { getDbBySport } from '../utils/dbUtils.js';

export const getCompetitions = async (offset = 0, limit = 100, filters = {}, sport = 'cs2') => {
  const db = getDbBySport(sport);
  let query = `SELECT * FROM competitions`;
  const params = [];
  const conditions = [];

  // Flexible date filtering
  if (filters.customRange) {
    const { from, to } = filters.customRange;
    conditions.push(`start_date BETWEEN ? AND ?`);
    params.push(from, to);
  } else if (filters.start_date && filters.end_date) {
    conditions.push(`start_date BETWEEN ? AND ?`);
    params.push(filters.start_date, filters.end_date);
  } else if (filters.start_date) {
    conditions.push(`start_date >= ?`);
    params.push(filters.start_date);
  } else if (filters.end_date) {
    conditions.push(`start_date <= ?`);
    params.push(filters.end_date);
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
