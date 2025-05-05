//Este archivo trae directamente de la API los jugadores participanten en cada torneo, los cuenta, y los inserta en el campo "no_participants" de la tabla competitions

import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

const connection = await mysql.createConnection(dbConfig);

async function actualizarParticipantes() {
  try {
    // Paso 1: Obtener todos los competitionIds de la tabla "competitions"
    const [competitions] = await connection.execute('SELECT id FROM competitions');

    // Paso 2: Iterar sobre cada competitionId
    for (const competition of competitions) {
      const competitionId = competition.id;

      // Hacer la solicitud de los participantes
      const { data } = await axios.get(`http://localhost:3000/api/competitions/${competitionId}/participants`);

      // Contar los participantes
      const no_participants = data.participants ? data.participants.length : 0;

      // Paso 3: Actualizar el campo no_participants en la tabla competitions
      await connection.execute(
        'UPDATE competitions SET no_participants = ? WHERE id = ?',
        [no_participants, competitionId]
      );

      console.log(`Actualizado competitionId: ${competitionId} con ${no_participants} participantes.`);
    }
  } catch (error) {
    console.error('Error al actualizar los participantes:', error);
  } finally {
    await connection.end();
  }
}

// Llamar a la función para actualizar los participantes
actualizarParticipantes();
