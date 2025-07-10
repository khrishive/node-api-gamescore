import mysql from 'mysql2/promise';

const createConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

export const getRecords = async (tableName, offset, limit, filters = {}, orderBy = '') => {
  const connection = await createConnection();
  let query = `SELECT * FROM \`${tableName}\``;
  let params = [];
  const conditions = [];

  // Filtros por rango de fechas (solo para competitions)
  if (tableName === 'competitions' && filters.from && filters.to) {
    const fromTimestamp = new Date(filters.from).getTime();
    const toTimestamp = new Date(filters.to).getTime();
    conditions.push('(start_date BETWEEN ? AND ? OR end_date BETWEEN ? AND ?)');
    params.push(fromTimestamp, toTimestamp, fromTimestamp, toTimestamp);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // Orden condicional
  if (orderBy) {
    query += ` ORDER BY ${orderBy}`;
  } else if (tableName === 'competitions') {
    query += ' ORDER BY updated_at DESC';
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

