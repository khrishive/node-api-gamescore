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

const API_URL = `${process.env.GAME_SCORE_API}/fixtures`;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

const FIXTURES_TABLE = `fixtures`;
const DATE_RANGES_TABLE = `date_ranges_script_fixtures`;

async function getNextDateRange(pool, sport) {
    const [rows] = await pool.execute(
        `SELECT * FROM ${DATE_RANGES_TABLE} 
         WHERE execution_status = 0 AND sport = ? 
         ORDER BY start_date ASC 
         LIMIT 1`,
        [sport]
    );
    return rows[0];
}

async function updateDateRangeStatus(pool, rangeId, recordsCreated) {
    await pool.execute(
        `UPDATE ${DATE_RANGES_TABLE} 
         SET execution_status = 1, records_created = ? 
         WHERE id = ?`,
        [recordsCreated, rangeId]
    );
}

async function fetchFixtures(sport, startDate, endDate) {
    let allFixtures = [];
    let page = 1;
    let keepFetching = true;

    console.log(`🗓️ Fetching fixtures for sport '${sport}' from ${startDate} to ${endDate}`);

    try {
        while (keepFetching) {
            console.log(
              `${API_URL}?sport=${sport}&from=${startDate}&to=${endDate}&page=${page}`
            );
            const response = await axios.get(`${API_URL}?sport=${sport}&from=${startDate}&to=${endDate}&page=${page}`, {
                headers: { Authorization: AUTH_TOKEN }
            });

            const fixtures = response?.data?.fixtures;

            if (fixtures && fixtures.length > 0) {
                allFixtures = allFixtures.concat(fixtures);
                console.log(`🔍 Page ${page}: Fetched ${fixtures.length} fixtures for sport '${sport}'.`);
            }

            if (!fixtures || fixtures.length < 50) {
                keepFetching = false;
            } else {
                page++;
            }
        }
        console.log(`✅ Total fixtures fetched for sport '${sport}' in this range: ${allFixtures.length}`);
        return allFixtures;
    } catch (error) {
        if (error.response) {
            console.error("Request failed:", error.response.status, error.response.data);
        } else if (error.request) {
            console.error("No response received:", error.request);
        } else {
            console.error("Error:", error.message);
        }
        return [];
    }
}

async function saveFixturesToDB(fixtures, pool) {
    if (!fixtures || fixtures.length === 0) {
        console.log('✅ No new fixtures to insert.');
        return 0;
    }

    const insertFixturesQuery = `
        INSERT INTO ${FIXTURES_TABLE} (
            id, competition_id, competition_name, end_time, scheduled_start_time, sport_alias, sport_name, start_time, status, tie, winner_id,
            participants0_id, participants0_name, participants0_score, participants1_id, participants1_name, participants1_score
        ) VALUES ?
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
        const fixtureValues = fixtures.map((fixture) => [
            fixture.id,
            fixture.competition?.id || null,
            fixture.competition?.name || null,
            fixture.endTime || null,
            fixture.scheduledStartTime || null,
            fixture.sport?.alias || null,
            fixture.sport?.name || null,
            fixture.startTime || null,
            fixture.status || 'TBD',
            fixture.tie || false,
            fixture.winnerId || null,
            fixture.participants[0]?.id || null,
            fixture.participants[0]?.name || null,
            fixture.participants[0]?.score || null,
            fixture.participants[1]?.id || null,
            fixture.participants[1]?.name || null,
            fixture.participants[1]?.score || null
        ]);

        await pool.query(insertFixturesQuery, [fixtureValues]);
        console.log(`✅ Inserted/updated ${fixtureValues.length} fixtures in table ${FIXTURES_TABLE}`);
        return fixtureValues.length;
    } catch (error) {
        console.error("❌ saveFixturesToDB failed:", error.message);
        throw error;
    }
}

export async function processFixturesForDateRange(sport) {
    const sportToUse = sport || process.argv[2] || 'cs2';
    if (!SUPPORTED_SPORTS.includes(sportToUse)) {
        console.error(`Unsupported sport: ${sportToUse}`);
        return;
    }

    const dbConfig = dbConfigs[sportToUse];
    if (!dbConfig) {
        throw new Error(`No DB config found for sport: ${sportToUse}`);
    }
    const pool = mysql.createPool(dbConfig);

    try {
        console.log(`🔄 Checking for next available date range for sport: ${sportToUse}`);
        const dateRange = await getNextDateRange(pool, sportToUse);

        if (!dateRange) {
            console.log(`✅ No pending date ranges found for sport '${sportToUse}'. Exiting.`);
            return;
        }

        console.log(`🗓️ Processing date range ID ${dateRange.id}: ${dateRange.start_date} to ${dateRange.end_date}`);

        const startDate = new Date(dateRange.start_date).toISOString().split("T")[0];
        const endDate = new Date(dateRange.end_date).toISOString().split("T")[0];

        const fixtures = await fetchFixtures(sportToUse, startDate, endDate);
        
        const recordsCreated = await saveFixturesToDB(fixtures, pool);
        
        await updateDateRangeStatus(pool, dateRange.id, recordsCreated);
        
        console.log(`✅ Successfully processed date range ID ${dateRange.id}. Created/updated ${recordsCreated} records.`);

    } catch (error) {
        console.error("❌ An error occurred during the process:", error.message);
        throw error;
    } finally {
        await pool.end();
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
        await processFixturesForDateRange(sport);
        if (parentPort) {
            parentPort.postMessage('Fixture processing for date range completed successfully.');
        } else {
            console.log('Fixture processing for date range completed successfully.');
        }
    } catch (error) {
        const errorMsg = `Failed to process fixtures for sport ${sport}: ${error.message}`;
        console.error(errorMsg);
        if (parentPort) {
            parentPort.postMessage({ error: errorMsg });
        } else {
            process.exit(1);
        }
    }
}

main();
