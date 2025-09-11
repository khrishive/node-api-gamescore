// Import the necessary dependencies
import axios from 'axios';           // HTTP client to make requests to external APIs
import dotenv from 'dotenv';         // Allows loading environment variables from a .env file
import mysql from 'mysql2/promise';  // MySQL client with promise support

// Load the environment variables defined in the .env file
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

// Constants for the teams API
const API_URL = `${process.env.GAME_SCORE_API}/teams`;         // Base URL of the teams API
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;  // Authentication token for the API
const DB_SERVER_TOKEN = process.env.API_KEY; 



/**
 * Gets the information of a team using its ID from the external API.
 * @ param {string|number} id - The ID of the team to consult.
 * @ returns {Promise<Object>} - Returns an object with the team information or an empty object in case of error.
 */
async function fetchTeamInfo(id) {
    try {
        const response = await axios.get(`${API_URL}/${id}`, {
            headers: {
                Authorization: AUTH_TOKEN,
            }
        });
        return response.data || {};
    } catch (error) {
        console.error(`❌ Error getting data from the API for id ${id}:`, error.message);
        return {};
    }
}

/**
 * Gets the unique IDs of participants from the fixtures API.
 * @ returns {Promise<string[]>} - Returns an array of unique participant IDs.
 */
async function fetchUniqueParticipants(connection) {
    console.log('🔄 Fetching unique participants from the fixtures table...');
    try {
        const [rows] = await connection.execute(
            'SELECT participants0_id, participants1_id FROM fixtures'
        );
        // Flatten and filter unique IDs
        const uniqueIds = [
            ...new Set(
                rows.flatMap(row => [row.participants0_id, row.participants1_id])
                    .filter(id => !!id)
            )
        ];
        console.log(`🎯 ${uniqueIds.length} unique participants found.`);
        return uniqueIds;
    } catch (error) {
        console.error('❌ Error fetching participants from the fixtures table:', error.message);
        return [];
    }
}


/**
 * Extracts the IDs and names of the players from a team's lineup.
 * Returns a flat array: [player_id_0, player_name_0, ..., player_id_4, player_name_4]
 * @ param {Array} lineup - Array of players (can contain up to 5 players).
 * @ returns {Array} - Flat array with the IDs and names of the players, or null if missing.
 */
function extractLineup(lineup) {
    const result = [];
    for (let i = 0; i < 5; i++) {
        if (lineup && lineup[i]) {
            result.push(lineup[i].id ? String(lineup[i].id) : null);    // Player ID
            result.push(lineup[i].name ? String(lineup[i].name) : null); // Player name
        } else {
            result.push(null, null); // If the player is missing, add two nulls
        }
    }
    return result;
}

/**
 * Saves (or updates) the information of a team in the participants table of the database.
 * Uses REPLACE INTO to insert or update the record according to the ID.
 * @ param {Object} connection - MySQL connection.
 * @ param {Object} team - Object with the team information.
 */
async function saveParticipant(connection, team) {
    const lineup = extractLineup(team.most_recent_lineup);

    const sql = `
        REPLACE INTO participants (
            id, name, sport, country, countryISO, region,
            player_id_0, player_name_0,
            player_id_1, player_name_1,
            player_id_2, player_name_2,
            player_id_3, player_name_3,
            player_id_4, player_name_4
        ) VALUES (?, ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Prepare the values for the SQL query
    const values = [
        team.id ? String(team.id) : null,
        team.name || null,
        team.sport || null,
        team.country || null,
        team.countryISO || null,
        team.region || null,
        ...lineup
    ];

    try {
        await connection.execute(sql, values);
        console.log(`✅ Saved team ${team.name} (${team.id})`);
    } catch (error) {
        console.error(`❌ Error saving team ${team.id}:`, error.message);
    }
}

const pool = mysql.createPool(dbConfig);

/**
 * Main function: gets the unique team IDs, queries the info of each team,
 * and saves it in the database.
 */
export async function main() {
    let connection;
    try {
        connection = await pool.getConnection();
        const uniqueIds = await fetchUniqueParticipants(connection);

        for (const id of uniqueIds) {
            const teamInfo = await fetchTeamInfo(id);
            if (teamInfo && teamInfo.id) {
                await saveParticipant(connection, teamInfo);
            }
        }
        console.log('✅ Process completed.');
    } catch (error) {
        console.error('❌ Error in the main process:', error);
    } finally {
        if (connection) await connection.release();
        await pool.end();
    }
}

// Execute the main script
import { parentPort, workerData } from 'worker_threads';

if (parentPort) {
    main(workerData.sport).then(() => {
        parentPort.postMessage('Teams inserted successfully.');
    });
} else {
    main(process.argv[2]).then(() => {
        console.log('Teams inserted successfully.');
    });
}