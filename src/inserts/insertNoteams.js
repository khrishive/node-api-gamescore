//Este archivo trae directamente de la API los jugadores participantes en cada torneo,
//los cuenta, y los inserta en el campo "no_participants" de la tabla competitions.

import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
};

const API_URL = `${process.env.GAME_SCORE_API}/competitions`;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

export async function actualizarParticipantes() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Paso 1: Obtener todos los competitionIds de la tabla "competitions"
    const [competitions] = await connection.execute('SELECT id FROM competitions');

    for (const competition of competitions) {
      const competitionId = competition.id;
      try {
        // Hacer la solicitud de los participantes con timeout
        const { data } = await axios.get(`${API_URL}/${competitionId}/participants`, {
          headers: {
            Authorization: AUTH_TOKEN,
          },
          timeout: 15000, // 15 segundos
        });

        // Contar los participantes de manera segura
        const no_participants = Array.isArray(data.participants) ? data.participants.length : 0;

        // Paso 3: Actualizar el campo no_participants en la tabla competitions
        await connection.execute(
          'UPDATE competitions SET no_participants = ? WHERE id = ?',
          [no_participants, competitionId]
        );

        console.log(`✅ Actualizado competitionId: ${competitionId} con ${no_participants} participantes.`);
      } catch (error) {
        if (error.code === 'ECONNRESET') {
          console.error(`❌ ECONNRESET al consultar participantes de competitionId ${competitionId}.`);
        } else if (error.code === 'ECONNABORTED') {
          console.error(`❌ Timeout al consultar participantes de competitionId ${competitionId}.`);
        } else if (error.response) {
          console.error(`❌ Error HTTP ${error.response.status} para competitionId ${competitionId}:`, error.response.data);
        } else {
          console.error(`❌ Error inesperado para competitionId ${competitionId}:`, error.message);
        }
        // Opcional: podrías guardar en la DB que hubo error en ese torneo
      }
    }
  } catch (error) {
    console.error('❌ Error general al actualizar los participantes:', error);
  } finally {
    await connection.end();
  }
}

await actualizarParticipantes();