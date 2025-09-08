import axios from 'axios';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Get sport from command line argument, default to 'cs2'
const sportArg = process.argv[2] || 'cs2';
const SUPPORTED_SPORTS = ['cs2', 'lol'];
const SPORT = SUPPORTED_SPORTS.includes(sportArg) ? sportArg : 'cs2';

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

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
console.log(`🔐 Using OpenAI API Key: ${OPENAI_API_KEY}...`);
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const BATCH_SIZE = 50;

// Prompt for ChatGPT, adjusts based on sport
const buildPrompt = (name, sport) => {
    let emphasis = '';
    if (sport === 'cs2') {
        emphasis = 'Counter-Strike';
    } else if (sport === 'lol') {
        emphasis = 'League of Legends';
    } else {
        emphasis = sport;
    }
    return `
        Describe briefly what the "${name}" tournament is about, emphasizing that it is a ${emphasis} competition. Return only a JSON object with a single key 'description' and avoid explanations.
    `;
};

async function fetchDescriptionFromOpenAI(name, retries = 3, delay = 3000) {
  while (retries > 0) {
    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: 'gpt-3.5-turbo', // or 'gpt-4' if you have access
          messages: [
            {
              role: 'user',
              content: buildPrompt(name, SPORT)
            }
          ],
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const raw = response.data.choices[0].message.content;
      // Try to extract JSON from the response
      const jsonMatch = raw.match(/```json\s*([\s\S]+?)\s*```/) || raw.match(/{[\s\S]+}/);
      let parsed = null;
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (err) {
          parsed = null;
        }
      }
      return parsed?.description?.trim() || null;
    } catch (err) {
      if (err.response?.status === 429) {
        console.warn(`⏳ OpenAI 429: Waiting ${delay}ms before retrying (${name})...`);
        await new Promise(res => setTimeout(res, delay));
        retries--;
        delay *= 2; // Exponential backoff
      } else {
        console.error(`❌ Error querying OpenAI for "${name}":`, err.message);
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

export async function updateTournamentDescriptionsOpenAI() {
  const connection = await mysql.createConnection(dbConfig);
  let batchNumber = 1;

  try {
    while (true) {
      const remaining = await countRemainingTournaments(connection);
      if (remaining === 0) {
        console.log('✅ All tournaments already have a description.');
        break;
      }

      console.log(`📦 Batch #${batchNumber} | Pending tournaments: ${remaining}`);

      const [rows] = await connection.execute(
        `SELECT id, name FROM competitions 
          WHERE description IS NULL OR description = 'Waiting for information'
          ORDER BY id ASC 
          LIMIT ${BATCH_SIZE}
        `
      );

      for (const { id, name } of rows) {
        console.log(`\n🎯 Processing tournament [${id}] ${name}...`);

        const description = await fetchDescriptionFromOpenAI(name);

        if (description) {
          await connection.execute(
            `UPDATE competitions SET description = ? WHERE id = ?`,
            [description, id]
          );
          console.log(`✅ Description saved for ID ${id}`);
        } else {
          console.warn(`⚠️ Could not generate description for ${name}`);
        }

        await new Promise(res => setTimeout(res, 1000)); // delay between requests
      }

      batchNumber++;
    }
  } catch (err) {
    console.error('💥 Critical error:', err.message);
  } finally {
    await connection.end();
    console.log('🔚 Connection closed.');
  }
}

// CLI usage
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  updateTournamentDescriptionsOpenAI()
    .then(() => console.log('✅ All processes completed.'))
    .catch(err => {
      console.error('❌ Error during execution:', err);
      process.exit(1);
    });
}