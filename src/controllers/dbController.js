import mysql from 'mysql2/promise';

// Crear una conexión a la base de datos
const createConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

// Obtener todos los registros de una tabla
const getAllRecords = async (tableName) => {
  const connection = await createConnection();
  const [rows] = await connection.execute(`SELECT * FROM ${tableName}`);
  await connection.end();
  return rows;
};

export default getAllRecords;