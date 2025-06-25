import mysql from 'mysql2/promise';

const createConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

export const getRecords = async (tableName, offset = 0, limit = 100, filters = {}) => {
  const connection = await createConnection();
  let query = `SELECT * FROM \`${tableName}\``;
  let params = [];
  const conditions = [];

  if (filters.todayRange || filters.customRange) {
    const range = filters.todayRange || filters.customRange;
    const { from, to } = range;

    // Agregamos condiciones OR basadas en el status
    const statusCondition = `
      (
        (status = 'Scheduled' AND scheduled_start_time BETWEEN ? AND ?)
        OR
        ((status = 'Started' OR status = 'Ended') AND start_time BETWEEN ? AND ?)
      )
    `;
    conditions.push(statusCondition);
    params.push(from, to, from, to);
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


// Obtener todos los registros de una tablaMore actions
export const getAllRecords = async (tableName) => {
  const connection = await createConnection();
  const [rows] = await connection.execute(`SELECT * FROM ${tableName}`);
  await connection.end();
  return rows;
};

