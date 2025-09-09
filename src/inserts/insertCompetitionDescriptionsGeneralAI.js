import axios from 'axios';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Get sport and provider from command line argument or .env
const sportArg = process.argv[2] || process.env.DEFAULT_SPORT || 'cs2';
const provider = process.argv[3] || process.env.AI_PROVIDER || 'gemini';
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

// API keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// API URLs
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const BATCH_SIZE = 50;

// Prompt builder
const buildPrompt = (name, sport) => {
    let sportName = '';
    if (sport === 'cs2') sportName = 'Counter-Strike 2';
    else if (sport === 'lol') sportName = 'League of Legends';
    else sportName = sport;

    return `
        You are an expert esports analyst. Write a concise, informative, and engaging description for the tournament "${name}", focusing on its relevance and format in the game "${sportName}".
        The tournament name is "${name}" and the game name is "${sportName}".
        Return only a JSON object with a single key 'description' and avoid any explanations or extra text.
        Do not use placeholders like [Game Name], [Tournament Name], or similar; always use the actual tournament and game names.
    `;
};

// Gemini fetch
async function fetchDescriptionGemini(name, sport, retries = 3, delay = 3000) {
  while (retries > 0) {
    try {
      const res = await axios.post(
        GEMINI_API_URL,
        { contents: [{ parts: [{ text: buildPrompt(name, sport) }] }] },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const raw = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = raw.match(/```json\s*([\s\S]+?)\s*```/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[1]) : null;
      return parsed?.description?.trim() || null;
    } catch (err) {
      if (err.response?.status === 429) {
        console.warn(`⏳ Gemini 429: Waiting ${delay}ms before retrying (${name})...`);
        await new Promise(res => setTimeout(res, delay));
        retries--;
        delay *= 2;
      } else {
        console.error(`❌ Gemini error for "${name}":`, err.message);
        break;
      }
    }
  }
  return null;
}

// OpenAI fetch
async function fetchDescriptionOpenAI(name, sport, retries = 3, delay = 3000) {
  while (retries > 0) {
    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: buildPrompt(name, sport) }],
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
      const jsonMatch = raw.match(/```json\s*([\s\S]+?)\s*```/) || raw.match(/{[\s\S]+}/);
      let parsed = null;
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]); } catch (err) { parsed = null; }
      }
      return parsed?.description?.trim() || null;
    } catch (err) {
      if (err.response?.status === 429) {
        console.warn(`⏳ OpenAI 429: Waiting ${delay}ms before retrying (${name})...`);
        await new Promise(res => setTimeout(res, delay));
        retries--;
        delay *= 2;
      } else {
        console.error(`❌ OpenAI error for "${name}":`, err.message);
        break;
      }
    }
  }
  return null;
}

// General fetcher
async function fetchDescription(name, sport) {
  if (provider === 'gemini') return await fetchDescriptionGemini(name, sport);
  if (provider === 'openai') return await fetchDescriptionOpenAI(name, sport);
  throw new Error(`Unsupported provider: ${provider}`);
}

async function countRemainingTournaments(connection) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS remaining 
     FROM competitions 
     WHERE description = 'Waiting for information' OR description IS NULL;`
  );
  return rows[0].remaining;
}

const outputFile = `tournament_descriptions_${provider}_${SPORT}.json`;
if (SAVE_TO_FILE) fs.writeFileSync(outputFile, '[\n', 'utf8');

export async function updateTournamentDescriptionsGeneralAI() {
  const connection = await mysql.createConnection(dbConfig);
  let batchNumber = 1;
  let firstRecord = true;

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
        const description = await fetchDescription(name, SPORT);

        const record = {
          id,
          name,
          sport: SPORT,
          provider,
          description: description || 'No description generated'
        };

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
          console.log(`✅ Description saved for ID ${id}`);
        } else {
          console.warn(`⚠️ Could not generate description for ${name}`);
        }

        await new Promise(res => setTimeout(res, 3000));
      }

      batchNumber++;
    }

    if (SAVE_TO_FILE) {
      fs.appendFileSync(outputFile, '\n]\n', 'utf8');
      console.log(`📝 File ${outputFile} saved with all descriptions.`);
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
  updateTournamentDescriptionsGeneralAI()
    .then(() => console.log('✅ All processes completed.'))
    .catch(err => {
      console.error('❌ Error during execution:', err);
      process.exit(1);
    });
}