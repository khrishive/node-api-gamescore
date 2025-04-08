import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors()); // Permite que tu frontend local acceda
app.use(express.json());

// Ruta de prueba
app.get('/api/datos', async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [rows] = await connection.execute('SELECT * FROM competitions');
    await connection.end();

    res.json(rows);
  } catch (error) {
    console.error('Error en la conexión:', error);
    res.status(500).json({ error: 'Error de servidor' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${process.env.PORT}`);
});
