import mysql from 'mysql2/promise';

// Crear una conexión a la base de datos
const createConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    //port: process.env.DB_PORT,
  });
};

// Obtener registros paginados de una tabla, con filtros
const getRecords = async (tableName, offset = 0, limit = 100, filters = {}) => {
  const connection = await createConnection();

  // PRECAUCIÓN: tableName no debe venir del usuario sin validar para evitar SQL injection
  let query = `SELECT * FROM \`${tableName}\``;
  let params = [];
  const filterKeys = Object.keys(filters);

  if (filterKeys.length > 0) {
    const filterClauses = filterKeys.map(key => {
      // Por seguridad, solo permitimos letras, números y guion_bajo en el nombre de la columna
      if (!/^[a-zA-Z0-9_]+$/.test(key)) throw new Error('Nombre de columna inválido');
      params.push(filters[key]);
      return `\`${key}\` = ?`;
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