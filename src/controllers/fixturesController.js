import mysql from 'mysql2/promise';

const createConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

export const getFixtures = async (offset = 0, limit = 100, filters = {}, sport = 'cs2') => {
  const connection = await createConnection();
  let query = `SELECT * FROM fixtures`;
  const params = [];
  const conditions = [];

  // Flexible date filtering for start_time and end_time only
  if (filters.customRange) {
    const { from, to } = filters.customRange;
    conditions.push(`start_time BETWEEN ? AND ?`);
    params.push(from, to);
  } else if (filters.from && filters.to) {
    conditions.push(`start_time BETWEEN ? AND ?`);
    params.push(filters.from, filters.to);
  } else if (filters.from) {
    conditions.push(`start_time >= ?`);
    params.push(filters.from);
  } else if (filters.to) {
    conditions.push(`start_time <= ?`);
    params.push(filters.to);
  }

  // Direct filter for end_time if provided
  if (filters.end_time) {
    conditions.push('end_time <= ?');
    params.push(filters.end_time);
  }

  // Direct filter for scheduled_start_time if provided
  if (filters.scheduled_start_time) {
    conditions.push('scheduled_start_time >= ?');
    params.push(filters.scheduled_start_time);
  }

  // All other optional filters
  const filterFields = [
    'id', 'competition_id', 'format_value',
    'sport_alias', 'sport_name', 'status', 'tie', 'winner_id',
    'participants0_id', 'participants0_score', 'participants0_name',
    'participants1_id', 'participants1_score', 'participants1_name'
  ];

  for (const field of filterFields) {
    if (filters[field] !== undefined) {
      conditions.push(`\`${field}\` = ?`);
      params.push(filters[field]);
    }
  }

  // LIKE for competition_name, format_name, sport_name, status, participants0_name, participants1_name
  const likeFields = [
    'competition_name',
    'format_name',
    'sport_name',
    'status',
    'participants0_name',
    'participants1_name'
  ];

  for (const field of likeFields) {
    if (filters[field]) {
      conditions.push(`\`${field}\` LIKE ?`);
      params.push(`%${filters[field]}%`);
    }
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
  }

  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 100;
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;

  query += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;

  const [rows] = await connection.execute(query, params);
  await connection.end();
  return rows;
};
