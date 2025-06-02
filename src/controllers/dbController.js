import mysql from 'mysql2/promise';

const createConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

const getRecords = async (tableName, offset = 0, limit = 100, filters = {}) => {
  const connection = await createConnection();
  let query = `SELECT * FROM \`${tableName}\``;
  let params = [];

  if (filters.todayRange) {
    const { start_day, end_day } = filters.todayRange;
    query += `
      WHERE
        (scheduled_start_time BETWEEN ? AND ?)
        OR (start_time BETWEEN ? AND ?)
        OR (end_time BETWEEN ? AND ?)
    `;
    params.push(start_day, end_day, start_day, end_day, start_day, end_day);
  }

  query += ' LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const [rows] = await connection.execute(query, params);
  await connection.end();
  return rows;
};

export default getRecords;