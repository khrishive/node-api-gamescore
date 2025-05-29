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

// Obtener registros paginados de una tabla
const getRecords = async (tableName, offset = 0, limit = 100) => {
  const connection = await createConnection();
  // PRECAUCIÓN: tableName no debe venir del usuario sin validar para evitar SQL injection
  const [rows] = await connection.execute(
    `SELECT * FROM \`${tableName}\` LIMIT ? OFFSET ?`,
    [Number(limit), Number(offset)]
  );
  await connection.end();
  return rows;
};

export default getRecords;