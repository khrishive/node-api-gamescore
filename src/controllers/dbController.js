import mysql from 'mysql2/promise';

const createConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

// Ahora acepta filtros de tipo rango (from/to)
const getRecords = async (tableName, offset = 0, limit = 100, filters = {}) => {
  const connection = await createConnection();
  let query = `SELECT * FROM \`${tableName}\``;
  let params = [];
  const filterKeys = Object.keys(filters);

  if (filterKeys.length > 0) {
    const filterClauses = filterKeys.map(key => {
      if (!/^[a-zA-Z0-9_]+$/.test(key)) throw new Error('Nombre de columna inválido');
      const value = filters[key];
      if (typeof value === 'object' && value.from !== undefined && value.to !== undefined) {
        params.push(value.from, value.to);
        return `\`${key}\` BETWEEN ? AND ?`;
      } else {
        params.push(value);
        return `\`${key}\` = ?`;
      }
    });
    query += ' WHERE ' + filterClauses.join(' AND ');
  }

  query += ' LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  const [rows] = await connection.execute(query, params);
  await connection.end();
  return rows;
};

export default getRecords;