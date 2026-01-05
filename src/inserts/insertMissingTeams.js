//src/inserts/insertMissingTeams.js
import axios from 'axios';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

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
  },
  dota2: {
    host: process.env.DB_DOTA2_HOST,
    user: process.env.DB_DOTA2_USER,
    password: process.env.DB_DOTA2_PASSWORD,
    database: process.env.DB_DOTA2_NAME,
    port: process.env.DB_DOTA2_PORT || 3306
  }
};

const API_URL = `${process.env.GAME_SCORE_API}/teams`;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

const safeText = (value) =>
  value && String(value).trim().length > 0
    ? value
    : 'Waiting for information';

async function fetchTeamInfo(id) {
  try {
    const { data } = await axios.get(`${API_URL}/${id}`, {
      headers: { Authorization: AUTH_TOKEN }
    });
    return data || {};
  } catch (error) {
    console.error(`❌ API error for team ${id}:`, error.message);
    return {};
  }
}

async function fetchUniqueParticipants(connection) {
  console.log('🔄 Fetching unique participants missing from participants table...');
  try {
    const [rows] = await connection.execute(`
      SELECT participants0_id AS participant_id
      FROM fixtures
      WHERE participants0_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM participants WHERE id = fixtures.participants0_id)
      UNION
      SELECT participants1_id AS participant_id
      FROM fixtures
      WHERE participants1_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM participants WHERE id = fixtures.participants1_id)
    `);

    const uniqueIds = [...new Set(
      rows
        .map(r => r.participant_id)
        .filter(id => id && String(id).trim() !== '')
    )];

    console.log(`🎯 ${uniqueIds.length} unique participants found.`);
    return uniqueIds;
  } catch (error) {
    console.error('❌ Error fetching participants:', error.message);
    return [];
  }
}

function extractLineup(lineup) {
  const result = [];
  for (let i = 0; i < 5; i++) {
    if (lineup && lineup[i]) {
      result.push(lineup[i].id ? String(lineup[i].id) : null);
      result.push(lineup[i].name ? String(lineup[i].name) : null);
    } else {
      result.push(null, null);
    }
  }
  return result;
}

async function saveParticipant(connection, team) {
  const lineup = extractLineup(team.most_recent_lineup);

  const sql = `
    REPLACE INTO participants (
      id, name, sport, country, countryISO, region,
      player_id_0, player_name_0,
      player_id_1, player_name_1,
      player_id_2, player_name_2,
      player_id_3, player_name_3,
      player_id_4, player_name_4,
      image_url,
      hs_description,
      rr_description
    ) VALUES (?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
              ?, ?, ?)
  `;

  const values = [
    team.id ? String(team.id) : null,
    team.name || null,
    team.sport || null,
    team.country || null,
    team.countryISO || null,
    team.region || null,
    ...lineup,
    team.image_url || null,
    safeText(team.hs_description),
    safeText(team.rr_description)
  ];

  try {
    await connection.execute(sql, values);
    console.log(`✅ Saved team ${team.name} (${team.id})`);
  } catch (error) {
    console.error(`❌ Error saving team ${team.id}:`, error.message);
  }
}

export async function processMissingTeams(sport = 'cs2') {
  const dbConfig = dbConfigs[sport];
  if (!dbConfig) throw new Error(`Unsupported sport: ${sport}`);

  const pool = mysql.createPool({
    ...dbConfig,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci'
  });

  let connection;

  try {
    connection = await pool.getConnection();
    const uniqueIds = await fetchUniqueParticipants(connection);

    await Promise.all(
      uniqueIds.map(async (id) => {
        const teamInfo = await fetchTeamInfo(id);
        if (teamInfo?.id) {
          await saveParticipant(connection, teamInfo);
        }
      })
    );

    console.log('✅ Missing teams process completed.');
  } catch (error) {
    console.error('❌ Error in processMissingTeams:', error.message);
  } finally {
    if (connection) await connection.release();
    await pool.end();
  }
}

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const sportArg = process.argv[2] || 'cs2';

  processMissingTeams(sportArg).catch(err => {
    console.error("❌ Fatal error:", err.message);
    process.exit(1);
  });
}
