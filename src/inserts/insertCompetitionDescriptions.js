import axios from 'axios';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Get sport from command line argument, default to 'cs2'
const sportArg = process.argv[2] || 'cs2';
const SUPPORTED_SPORTS = ['cs2', 'lol'];
const SPORT = SUPPORTED_SPORTS.includes(sportArg) ? sportArg : 'cs2';

// Get flag from .env to enable file saving
const SAVE_TO_FILE = process.env.SAVE_TOURNAMENTS_TO_FILE === 1;

// Select DB config based on sport
const dbConfigs = {
  cs2: {
    host: process.env.DB_CS2_HOST,
    user: process.env.DB_CS2_USER,
    password: process.env.DB_CS2_PASSWORD,
    database: process.env.DB_CS2_NAME,
    port: process.env.DB_CS2_PORT || 3306
  },
  lol: {
    host: process.env.DB_LOL_HOST,
    user: process.env.DB_LOL_USER,
    password: process.env.DB_LOL_PASSWORD,
    database: process.env.DB_LOL_NAME,
    port: process.env.DB_LOL_PORT || 3306
  }
};

const dbConfig = dbConfigs[SPORT];

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
const BATCH_SIZE = 50;

// Prompt para Gemini
const buildPrompt = (name, sport) => {
  let sportName = '';
  if (sport === 'cs2') {
    sportName = 'Counter-Strike 2';
  } else if (sport === 'lol') {
    sportName = 'League of Legends';
  } else {
    sportName = sport;
  }
  return `
You are an expert esports analyst. Write a concise, informative, and engaging description for the tournament "${name}", focusing on its relevance and format in ${sportName}. 
Return only a JSON object with a single key 'description' and avoid any explanations or extra text.
Do not use placeholders like [Game Name], [Tournament Name], or similar; always use the actual tournament and game names.
`;
};

async function fetchDescriptionFromGemini(name, sport, retries = 3, delay = 3000) {
  while (retries > 0) {
    try {
      const res = await axios.post(
        GEMINI_API_URL,
        {
          contents: [{ parts: [{ text: buildPrompt(name, sport) }] }]
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
    `SELECT COUNT(*) AS remaining 
     FROM competitions 
     WHERE description = 'Waiting for information' OR description IS NULL;`
  );
  return rows[0].remaining;
}

const outputFile = `tournament_descriptions_${SPORT}.json`;

// Create/overwrite the file at the beginning with an empty array if enabled
if (SAVE_TO_FILE) {
  fs.writeFileSync(outputFile, '[\n', 'utf8');
}

export async function updateTournamentDescriptions() {
  const connection = await mysql.createConnection(dbConfig);
  let batchNumber = 1;
  let firstRecord = true; // To handle commas between records

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
          WHERE description IS NULL OR description = 'Waiting for information'
          ORDER BY id ASC 
          LIMIT ${BATCH_SIZE}
        `
      );

      for (const { id, name } of rows) {
        console.log(`\n🎯 Procesando torneo [${id}] ${name}...`);

        const description = await fetchDescriptionFromGemini(name, SPORT);

        const record = {
          id,
          name,
          sport: SPORT,
          description: description || 'No description generated'
        };

        // Append each record to the file, handling commas for valid JSON array if enabled
        if (SAVE_TO_FILE) {
          const jsonRecord = JSON.stringify(record, null, 2);
          if (!firstRecord) {
            fs.appendFileSync(outputFile, ',\n' + jsonRecord, 'utf8');
          } else {
            fs.appendFileSync(outputFile, jsonRecord, 'utf8');
            firstRecord = false;
          }
        }

        if (description) {
          await connection.execute(
            `UPDATE competitions SET description = ? WHERE id = ?`,
            [description, id]
          );
          console.log(`✅ Descripción guardada para ID ${id}`);
        } else {
          console.warn(`⚠️ No se pudo generar descripción para ${name}`);
        }

        await new Promise(res => setTimeout(res, 3000)); // delay entre peticiones
      }

      batchNumber++;
    }

    // Close the JSON array if enabled
    if (SAVE_TO_FILE) {
      fs.appendFileSync(outputFile, '\n]\n', 'utf8');
      console.log(`📝 Archivo ${outputFile} guardado con todas las descripciones.`);
    }
  } catch (err) {
    console.error('💥 Error crítico:', err.message);
  } finally {
    await connection.end();
    console.log('🔚 Conexión cerrada.');
  }
}

updateTournamentDescriptions();
