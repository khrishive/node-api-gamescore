//This file brings directly from the API the participating players in each tournament,
//counts them, and inserts them into the "no_participants" field of the competitions table.

import mysql from 'mysql2/promise';
import axios from 'axios';
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

// Use sport-specific table if desired
const COMPETITIONS_TABLE = `competitions`;

const API_URL = `${process.env.GAME_SCORE_API}/competitions`;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

export async function actualizarParticipantes() {
    const connection = await mysql.createConnection({
        ...dbConfig,
        multipleStatements: true
    });
    console.log(`🔄 Updating participants for the sport: ${SPORT}`);
    try {
        // Step 1: Get all competitionIds from the "competitions" table
        const [competitions] = await connection.execute(`SELECT id FROM ${COMPETITIONS_TABLE}`);

        // Step 2: Get all participants and save in an array
        const updates = [];
        for (const competition of competitions) {
            const competitionId = competition.id;
            try {
                const { data } = await axios.get(`${API_URL}/${competitionId}/participants`, {
                    headers: {
                        Authorization: AUTH_TOKEN,
                    },
                    timeout: 15000, // 15 seconds
                });

                const no_participants = Array.isArray(data.participants) ? data.participants.length : 0;
                console.log(`🏆 competitionId ${competitionId} has ${no_participants} participants.`);
                updates.push([no_participants, competitionId]);
            } catch (error) {
                console.error(`❌ Error querying participants for competitionId ${competitionId}:`, error.message);
            }
        }

        // Step 3: Bulk update using multiple UPDATE statements
        if (updates.length > 0) {
            // Build all UPDATE statements
            const sqlStatements = updates.map(
                ([count, id]) => `UPDATE ${COMPETITIONS_TABLE} SET no_participants = ${mysql.escape(count)} WHERE id = ${mysql.escape(id)};`
            ).join('\n');

            // Enable multiple statements for this connection
            await connection.query({ sql: sqlStatements, multipleStatements: true });
            console.log(`✅ Bulk update completed for ${updates.length} competitions.`);
        } else {
            console.log('⚠️ No updates to apply.');
        }
    } catch (error) {
        console.error('❌ General error updating participants:', error);
    } finally {
        await connection.end();
    }
}

import { parentPort, workerData } from 'worker_threads';

async function main(sport) {
    await actualizarParticipantes(sport);
}

if (parentPort) {
    main(workerData.sport).then(() => {
        parentPort.postMessage('Number of participants updated successfully.');
    });
} else {
    main(process.argv[2]).then(() => {
        console.log('Number of participants updated successfully.');
    });
}
