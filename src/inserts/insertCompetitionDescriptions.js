import axios from 'axios';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
const BATCH_SIZE = 50;

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Prompt para Gemini
const buildPrompt = (name) => `
Describe briefly what the "${name}" tournament is about, emphasizing that it is a Counter-Strike competition. Return only a JSON object with a single key 'description' and avoid explanations.
`;

async function fetchDescriptionFromGemini(name, retries = 3, delay = 3000) {
  while (retries > 0) {
    try {
      const res = await axios.post(
        GEMINI_API_URL,
        {
          contents: [{ parts: [{ text: buildPrompt(name) }] }]
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const raw = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = raw.match(/```json\s*([\s\S]+?)\s*```/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[1]) : null;

      return parsed?.description?.trim() || null;
    } catch (err) {
      if (err.response?.status === 429) {
        console.warn(`⏳ Gemini 429: Esperando ${delay}ms antes de reintentar (${name})...`);
        await new Promise(res => setTimeout(res, delay));
        retries--;
        delay *= 2; // Exponential backoff
      } else {
        console.error(`❌ Error al consultar Gemini para "${name}":`, err.message);
        break;
      }
    }
  }

  return null;
}

async function countRemainingTournaments(connection) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS remaining FROM competitions WHERE description IS NULL`
  );
  return rows[0].remaining;
}

async function updateTournamentDescriptions() {
  const connection = await mysql.createConnection(dbConfig);
  let batchNumber = 1;

  try {
    while (true) {
      const remaining = await countRemainingTournaments(connection);
      if (remaining === 0) {
        console.log('✅ Todos los torneos ya tienen descripción.');
        break;
      }

      console.log(`📦 Lote #${batchNumber} | Torneos pendientes: ${remaining}`);

      const [rows] = await connection.execute(
        `SELECT id, name FROM competitions 
         WHERE description IS NULL 
         ORDER BY id ASC 
         LIMIT ${BATCH_SIZE}`
      );

      for (const { id, name } of rows) {
        console.log(`\n🎯 Procesando torneo [${id}] ${name}...`);

        const description = await fetchDescriptionFromGemini(name);

        if (description) {
          await connection.execute(
            `UPDATE competitions SET description = ? WHERE id = ?`,
            [description, id]
          );
          console.log(`✅ Descripción guardada para ID ${id}`);
        } else {
          console.warn(`⚠️ No se pudo generar descripción para ${name}`);
        }

        await new Promise(res => setTimeout(res, 1000)); // delay entre peticiones
      }

      batchNumber++;
    }
  } catch (err) {
    console.error('💥 Error crítico:', err.message);
  } finally {
    await connection.end();
    console.log('🔚 Conexión cerrada.');
  }
}

updateTournamentDescriptions();
