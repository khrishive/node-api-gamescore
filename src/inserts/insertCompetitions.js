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

async function fetchCompetitions(sport) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
    const endDate = new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0];

    try {
        const response = await axios.get(`${API_URL}?sport=${sport}&from=${startDate}&to=${endDate}`, {
            headers: { Authorization: AUTH_TOKEN }
        });
        console.log(`🔍 Competitions fetched from API for sport '${sport}':`, response.data.competitions);
        return response.data.competitions;
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

async function saveCompetitionsToDB(competitions, sport) {
    const dbConfig = dbConfigs[sport];
    if (!dbConfig) {
        throw new Error(`No DB config found for sport: ${sport}`);
    }
    const pool = mysql.createPool(dbConfig);

    const insertCompetitionsQuery = `
        INSERT INTO ${COMPETITIONS_TABLE} (
            id, name, sport_alias, start_date, end_date, prize_pool_usd,
            location, organizer, type, fixture_count, stage, time_of_year,
            year, series, tier, description
        ) VALUES ?
        ON DUPLICATE KEY UPDATE
            name = VALUES(name), sport_alias = VALUES(sport_alias),
            start_date = VALUES(start_date), end_date = VALUES(end_date),
            prize_pool_usd = VALUES(prize_pool_usd), location = VALUES(location),
            organizer = VALUES(organizer), type = VALUES(type),
            fixture_count = VALUES(fixture_count), stage = VALUES(stage),
            time_of_year = VALUES(time_of_year), year = VALUES(year),
            series = VALUES(series), tier = VALUES(tier),
            description = VALUES(description);
    `;

    try {
        const competitionValues = competitions.map((comp) => [
          comp.id,
          comp.name || "TBD",
          comp.sportAlias || "TBD",
          comp.startDate || "TBD",
          comp.endDate || "TBD",
          comp.prizePoolUSD || 0,
          comp.location || "TBD",
          comp.organizer || "TBD",
          comp.type || "TBD",
          comp.fixtureCount || 0,
          comp.derivatives?.stage || "TBD",
          comp.derivatives?.time_of_year || "TBD",
          comp.derivatives?.year || new Date().getFullYear(),
          comp.derivatives?.series || "TBD",
          comp.metadata?.liquipediaTier || "TBD",
          "Waiting for information",
        ]);

        await pool.query(insertCompetitionsQuery, [competitionValues]);
        console.log(`✅ Inserted/updated ${competitionValues.length} competitions in table ${COMPETITIONS_TABLE}`);
    } catch (error) {
        console.error("❌ saveCompetitionsToDB failed:", error.message);
        throw error; // re-throw to be caught by main
    } finally {
        await pool.end();
    }
}

export async function getAndSaveCompetitions(sport) {
    const sportToUse = sport || process.argv[2] || 'cs2';
    if (!SUPPORTED_SPORTS.includes(sportToUse)) {
        console.error(`Unsupported sport: ${sportToUse}`);
        return;
    }

    console.log(`🔄 getAndSaveCompetitions for sport: ${sportToUse}`);
    const competitions = await fetchCompetitions(sportToUse);
    console.log(`🔄 Filtered competitions for ${sportToUse}: ${competitions.length}`);
    if (competitions.length > 0) {
        await saveCompetitionsToDB(competitions, sportToUse);
        console.log(`✅ All competitions for ${sportToUse} processed.`);
    } else {
        console.log(`⚠️ No competitions found for sport: ${sportToUse}`);
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
        await getAndSaveCompetitions(sport);
        if (parentPort) {
            parentPort.postMessage('Competiciones insertadas exitosamente.');
        } else {
            console.log('Competiciones insertadas exitosamente.');
        }
    } catch (error) {
        const errorMsg = `Failed to insert competitions for sport ${sport}: ${error.message}`;
        console.error(errorMsg);
        if (parentPort) {
            parentPort.postMessage({ error: errorMsg });
        } else {
            process.exit(1);
        }
    }
}

main();
