import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';
import { parentPort, workerData } from 'worker_threads';

dotenv.config();

const SUPPORTED_SPORTS = ['cs2', 'lol'];

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

const API_URL = `${process.env.GAME_SCORE_API}/competitions`;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

const COMPETITIONS_TABLE = `competitions`;

async function fetchCompetitionsToUpdate(pool) {
    console.log('🔄 Fetching competitions with missing fields...');
    const [rows] = await pool.execute(
        `SELECT id FROM ${COMPETITIONS_TABLE} WHERE stage_type IS NULL OR number IS NULL OR region IS NULL`
    );
    console.log(`🎯 Found ${rows.length} competitions to update.`);
    return rows;
}

async function fetchCompetitionDetails(competitionId) {
    try {
        const response = await axios.get(`${API_URL}/${competitionId}`, {
            headers: { Authorization: AUTH_TOKEN }
        });
        return response.data || null;
    } catch (error) {
        console.error(`❌ Error getting details for competition ID ${competitionId}:`, error.message);
        return null;
    }
}

async function updateCompetitionDetails(pool, competitionData) {
    const { id, derivatives } = competitionData;

    if (!derivatives) {
        console.log(`   -> ⚠️ No derivatives object found for competition ID ${id}.`);
        return;
    }

    const fieldsToUpdate = [];
    const values = [];

    if (derivatives.hasOwnProperty('stage_type')) {
        fieldsToUpdate.push('stage_type = ?');
        values.push(derivatives.stage_type);
    }
    if (derivatives.hasOwnProperty('number')) {
        fieldsToUpdate.push('number = ?');
        values.push(derivatives.number);
    }
    if (derivatives.hasOwnProperty('region')) {
        fieldsToUpdate.push('region = ?');
        values.push(derivatives.region);
    }

    if (fieldsToUpdate.length === 0) {
        console.log(`   -> ⚠️ No new fields to update for competition ID ${id}.`);
        return;
    }

    console.log(`   -> Updating fields: ${fieldsToUpdate.map(f => f.split(' ')[0]).join(', ')}`);
    values.push(id); // Add the id for the WHERE clause

    const updateQuery = `
        UPDATE ${COMPETITIONS_TABLE}
        SET ${fieldsToUpdate.join(', ')}
        WHERE id = ?;
    `;

    try {
        await pool.execute(updateQuery, values);
        console.log(`   -> ✅ Successfully updated competition ID ${id}`);
    } catch (error) {
        console.error(`   -> ❌ Error updating competition ID ${id}:`, error.message);
    }
}

export async function updateMissingCompetitionFields(sport) {
    const sportToUse = sport || process.argv[2] || 'cs2';
    if (!SUPPORTED_SPORTS.includes(sportToUse)) {
        console.error(`Unsupported sport: ${sportToUse}`);
        return;
    }

    console.log(`🚀 Starting update for sport: ${sportToUse}`);

    const dbConfig = dbConfigs[sportToUse];
    if (!dbConfig) {
        throw new Error(`No DB config found for sport: ${sportToUse}`);
    }
    const pool = mysql.createPool(dbConfig);

    try {
        const competitionsToUpdate = await fetchCompetitionsToUpdate(pool);

        if (competitionsToUpdate.length > 0) {
            console.log('---');
            for (const competition of competitionsToUpdate) {
                console.log(`🔄 Processing competition ID: ${competition.id}`);
                const competitionDetails = await fetchCompetitionDetails(competition.id);
                if (competitionDetails) {
                    await updateCompetitionDetails(pool, competitionDetails);
                }
            }
            console.log('---');
        }

        console.log('✅ Process completed.');
    } catch (error) {
        console.error("❌ An error occurred during the process:", error.message);
        throw error;
    } finally {
        await pool.end();
        console.log('🔌 Database connection closed.');
    }
}

async function main() {
    let sport;
    if (parentPort) {
        sport = workerData.sport;
    } else {
        sport = process.argv[2];
    }

    try {
        await updateMissingCompetitionFields(sport);
        if (parentPort) {
            parentPort.postMessage('Competition update process completed successfully.');
        } else {
            console.log('Competition update process completed successfully.');
        }
    } catch (error) {
        const errorMsg = `Failed to update competitions for sport ${sport}: ${error.message}`;
        console.error(errorMsg);
        if (parentPort) {
            parentPort.postMessage({ error: errorMsg });
        } else {
            process.exit(1);
        }
    }
}

main();