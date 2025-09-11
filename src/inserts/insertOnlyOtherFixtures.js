import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT', 'GAME_SCORE_API', 'GAME_SCORE_APIKEY'];
requiredEnv.forEach(name => {
  if (!process.env[name]) throw new Error(`❌ Missing environment variable ${name}`);
});


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
 * Generate date ranges day by day between two dates.
 */
function generateDateRanges(startDate, endDate) {
    const ranges = [];
    let currentDate = new Date(startDate);

    while (currentDate <= new Date(endDate)) {
        const from = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        const to = from; // The same day for from and to
        ranges.push({ from, to });

        // Increment by one day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return ranges;
}

/**
 * API call to get fixtures for a specific date.
 */
async function fetchFixtures(from, to) {
    try {
        const response = await axios.get(API_URL, {
            headers: {
                Authorization: AUTH_TOKEN,
            },
            params: { sport: 'cs2', from, to },
        });
        return response.data.fixtures || [];
    } catch (error) {
        console.error(`❌ Error getting data from the API for the range ${from} to ${to}:`, error.message);
        return [];
    }
}

/**
 * Save fixtures to the database.
 */
async function saveFixturesToDB(fixtures) {
    const connection = await mysql.createConnection(dbConfig);

    const fixtureQuery = `
        INSERT INTO fixtures (
            id, competition_id, competition_name, end_time, scheduled_start_time, sport_alias, sport_name, start_time, status, tie, winner_id,
            participants0_id, participants0_name, participants0_score, participants1_id, participants1_name, participants1_score
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            competition_id = VALUES(competition_id),
            competition_name = VALUES(competition_name),
            end_time = VALUES(end_time),
            scheduled_start_time = VALUES(scheduled_start_time),
            sport_alias = VALUES(sport_alias),
            sport_name = VALUES(sport_name),
            start_time = VALUES(start_time),
            status = VALUES(status),
            tie = VALUES(tie),
            winner_id = VALUES(winner_id),
            participants0_id = VALUES(participants0_id),
            participants0_name = VALUES(participants0_name),
            participants0_score = VALUES(participants0_score),
            participants1_id = VALUES(participants1_id),
            participants1_name = VALUES(participants1_name),
            participants1_score = VALUES(participants1_score);
    `;

    try {
        for (const fixture of fixtures) {
            await connection.execute(fixtureQuery, [
                fixture.id,
                fixture.competition.id,
                fixture.competition.name,
                fixture.endTime,
                fixture.scheduledStartTime,
                fixture.sport.alias,
                fixture.sport.name,
                fixture.startTime,
                fixture.status,
                fixture.tie,
                fixture.winnerId,
                fixture.participants[0]?.id,
                fixture.participants[0]?.name,
                fixture.participants[0]?.score,
                fixture.participants[1]?.id,
                fixture.participants[1]?.name,
                fixture.participants[1]?.score
            ]);
            console.log(`✅ Fixture saved: ${fixture.id}`);
        }
    } catch (error) {
        console.error('❌ Error saving to the database:', error.message);
    } finally {
        await connection.end();
    }
}

/**
 * Process date ranges, get fixtures and save them to the database.
 * @ param {string} [endDate='2025-11-03'] - End date for the ranges.
 */
export async function processFixtures() {
    console.log('🔄 Generating date ranges...');

    // 📅 Calculate yesterday and tomorrow
    const now = new Date();
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0); // start of the day

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999); // end of the day

    // 🗓 Format to YYYY-MM-DD
    const formatDate = (date) => date.toISOString().split('T')[0];
    const fromDate = formatDate(yesterday);
    const toDate = formatDate(tomorrow);

    console.log(`📅 Calculated range: ${fromDate} → ${toDate}`);

    // 📌 Generate ranges with the calculated dates
    const dateRanges = generateDateRanges(fromDate, toDate);

    for (const range of dateRanges) {
        console.log(`🔄 Getting fixtures for the range: ${range.from} to ${range.to}`);

        const fixtures = await fetchFixtures(range.from, range.to);

        if (fixtures.length > 0) {
            console.log(`📥 ${fixtures.length} fixtures found, saving to the database...`);
            await saveFixturesToDB(fixtures);
        } else {
            console.log(`⚠️ No fixtures found for the date: ${range.from}`);
        }
    }

    console.log('✅ Process completed.');
}


await processFixtures()