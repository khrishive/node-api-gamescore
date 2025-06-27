import mysql from 'mysql2/promise';

const createConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

export const getCompetitions = async (offset = 0, limit = 100, filters = {}) => {
  const connection = await createConnection();
  let query = `SELECT * FROM competitions`;
  const params = [];
  const conditions = [];

  if (filters.customRange) {
    const { from, to } = filters.customRange;
    conditions.push(`start_date BETWEEN ? AND ?`);
    params.push(from, to);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY updated_at DESC`;

  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 100;
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;

  query += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;

  const [rows] = await connection.execute(query, params);
  await connection.end();
  return rows;
};
