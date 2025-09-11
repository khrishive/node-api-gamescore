import logger from '../inserts/live-data/loggers/fixturesLogger.js';
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

const API_URL = `${process.env.GAME_SCORE_API}/fixtures`;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

/**
 * Gets the fixtures from the API for a date range.
 */
async function fetchFixtures(from, to) {
    try {
        const response = await axios.get(API_URL, {
            headers: {
                Authorization: AUTH_TOKEN,
            },
            params: {
                sport: 'cs2',
                from,
                to,
            },
        });
        return response.data.fixtures || [];
    } catch (error) {
        logger.error('❌ Error getting fixtures', {
            from,
            to,
            message: error.message,
            stack: error.stack,
        });
        return [];
    }
}

/**
 * Compares API fixture with DB and updates if there are differences.
 */
async function updateFixtureIfChanged(apiFixture, db) {
    const [rows] = await db.execute(
        `SELECT status, start_time, end_time, participants0_score, participants1_score FROM fixtures WHERE id = ?`,
        [apiFixture.id]
    );

    if (rows.length === 0) {
        logger.warn('⚠️ Fixture not found in DB', { id: apiFixture.id });
        return;
    }

    const dbFixture = rows[0];
    const changes = {};

    if (apiFixture.status && apiFixture.status !== dbFixture.status) {
        changes.status = apiFixture.status;
    }

    if (
        apiFixture.startTime &&
        Number(apiFixture.startTime) !== Number(dbFixture.start_time)
    ) {
        changes.start_time = apiFixture.startTime;
    }

    if (
        apiFixture.endTime &&
        Number(apiFixture.endTime) !== Number(dbFixture.end_time)
    ) {
        changes.end_time = apiFixture.endTime;
    }

    const score0 = apiFixture.participants[0]?.score ?? null;
    const score1 = apiFixture.participants[1]?.score ?? null;

    if (score0 !== dbFixture.participants0_score) {
        changes.participants0_score = score0;
    }
    if (score1 !== dbFixture.participants1_score) {
        changes.participants1_score = score1;
    }

    if (Object.keys(changes).length > 0) {
        const fields = Object.keys(changes).map(key => `${key} = ?`).join(', ');
        const values = Object.values(changes);
        values.push(apiFixture.id);

        const updateQuery = `UPDATE fixtures SET ${fields} WHERE id = ?`;

        await db.execute(updateQuery, values);

        logger.info('🔁 Fixture updated', {
        id: apiFixture.id,
        changes,
    });
        
    } else {
        console.log(`✅ Fixture ${apiFixture.id} without changes.`);
    }
}

/**
 * Main process to synchronize fixtures.
 */
async function syncFixturesStatus(from, to) {
    const db = await mysql.createConnection(dbConfig);
    const fixtures = await fetchFixtures(from, to);

    for (const fixture of fixtures) {
        await updateFixtureIfChanged(fixture, db);
    }

    await db.end();
}

// 📌 Dates from YESTERDAY to TOMORROW
function getDateOffsetString(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

const fromDate = getDateOffsetString(-1); // yesterday
const toDate = getDateOffsetString(1);    // tomorrow

// Execute
try {
    console.log(`🔄 Synchronizing fixtures from ${fromDate} to ${toDate}...`);
    await syncFixturesStatus(fromDate, toDate);

    console.log('✅ Synchronization completed.');
} catch (err) {
    console.error('❌ General error during synchronization:', err.message);
}