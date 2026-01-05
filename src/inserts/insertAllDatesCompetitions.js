// src/inserts/insertCompetitions.js

import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';
import { parentPort, workerData } from 'worker_threads';

dotenv.config();

/**
 * ==============================
 * CONFIGURACIÓN GENERAL
 * ==============================
 * 👉 SOLO CAMBIA ESTAS FECHAS
 */
const DATE_RANGE_CONFIG = {
    from: '2025-01-01',
    to: '2026-12-01',
};

const SUPPORTED_SPORTS = [
    // 'cs2',
    // 'lol',
    'dota2',
];

const dbConfigs = {
    cs2: {
        host: process.env.DB_CS2_HOST,
        user: process.env.DB_CS2_USER,
        password: process.env.DB_CS2_PASSWORD,
        database: process.env.DB_CS2_NAME,
        port: process.env.DB_CS2_PORT || 3306,
    },
    lol: {
        host: process.env.DB_LOL_HOST,
        user: process.env.DB_LOL_USER,
        password: process.env.DB_LOL_PASSWORD,
        database: process.env.DB_LOL_NAME,
        port: process.env.DB_LOL_PORT || 3306,
    },
    dota2: {
        host: process.env.DB_DOTA2_HOST,
        user: process.env.DB_DOTA2_USER,
        password: process.env.DB_DOTA2_PASSWORD,
        database: process.env.DB_DOTA2_NAME,
        port: process.env.DB_DOTA2_PORT || 3306,
    },
};

const API_URL = `${process.env.GAME_SCORE_API}/competitions`;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

const COMPETITIONS_TABLE = `competitions`;

/**
 * ==============================
 * FETCH COMPETITIONS (API)
 * ==============================
 */
async function fetchCompetitions(sport, startDate, endDate) {
    console.log(
        `🗓️ Fetching competitions for sport '${sport}' from ${startDate} to ${endDate}`
    );

    try {
        const response = await axios.get(
            `${API_URL}?sport=${sport}&from=${startDate}&to=${endDate}`,
            { headers: { Authorization: AUTH_TOKEN } }
        );

        const competitions = response?.data?.competitions || [];

        console.log(
            `✅ Fetched ${competitions.length} competitions for '${sport}'.`
        );

        return competitions;
    } catch (error) {
        if (error.response) {
            console.error(
                'Request failed:',
                error.response.status,
                error.response.data
            );
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error:', error.message);
        }
        return [];
    }
}


/**
 * ==============================
 * SAVE COMPETITIONS (DB)
 * ==============================
 */
async function saveCompetitionsToDB(competitions, sport) {
    const dbConfig = dbConfigs[sport];
    if (!dbConfig) {
        throw new Error(`No DB config found for sport: ${sport}`);
    }

    const pool = mysql.createPool(dbConfig);

    const insertCompetitionsQuery = `
    INSERT INTO ${COMPETITIONS_TABLE} (
        id,
        name,
        sport_alias,
        start_date,
        end_date,
        prize_pool_usd,
        location,
        organizer,
        type,
        fixture_count,
        stage,
        time_of_year,
        year,
        series,
        tier,
        hs_description,
        rr_description,
        stage_type,
        number,
        region
    ) VALUES ?
    ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        sport_alias = VALUES(sport_alias),
        start_date = VALUES(start_date),
        end_date = VALUES(end_date),
        prize_pool_usd = VALUES(prize_pool_usd),
        location = VALUES(location),
        organizer = VALUES(organizer),
        type = VALUES(type),
        fixture_count = VALUES(fixture_count),
        stage = VALUES(stage),
        time_of_year = VALUES(time_of_year),
        year = VALUES(year),
        series = VALUES(series),
        tier = VALUES(tier),
        hs_description = VALUES(hs_description),
        rr_description = VALUES(rr_description),
        stage_type = VALUES(stage_type),
        number = VALUES(number),
        region = VALUES(region);
`;


    try {
        const competitionValues = competitions.map((comp) => [
            comp.id,
            comp.name || 'TBD',
            comp.sportAlias || 'TBD',
            comp.startDate || 9999999999999,
            comp.endDate || 9999999999999,
            comp.prizePoolUSD || 0,
            comp.location || 'Waiting for information',
            comp.organizer || 'Waiting for information',
            comp.type || 'Waiting for information',
            comp.fixtureCount || 0,
            comp.derivatives?.stage || 'Waiting for information',
            comp.derivatives?.time_of_year || 'Waiting for information',
            comp.derivatives?.year || 'Waiting for information',
            comp.derivatives?.series || 'Waiting for information',
            comp.metadata?.liquipediaTier || 'Waiting for information',
            null, // hs_description
            null, // rr_description
            comp.derivatives?.stage_type || null,
            comp.derivatives?.number || null,
            comp.derivatives?.region || null,
        ]);


        await pool.query(insertCompetitionsQuery, [competitionValues]);
        console.log(
            `✅ Inserted/updated ${competitionValues.length} competitions in table ${COMPETITIONS_TABLE}`
        );
    } catch (error) {
        console.error('❌ saveCompetitionsToDB failed:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

/**
 * ==============================
 * MAIN PUBLIC FUNCTION
 * ==============================
 */
export async function getAndSaveCompetitions(sport) {
    const sportToUse = sport || process.argv[2] || 'dota2';

    if (!SUPPORTED_SPORTS.includes(sportToUse)) {
        console.error(`Unsupported sport: ${sportToUse}`);
        return;
    }

    const { from, to } = DATE_RANGE_CONFIG;

    console.log(
        `🔄 getAndSaveCompetitions for ${sportToUse} | ${from} → ${to}`
    );

    const competitions = await fetchCompetitions(sportToUse, from, to);

    if (competitions.length > 0) {
        await saveCompetitionsToDB(competitions, sportToUse);
        console.log(`✅ All competitions for ${sportToUse} processed.`);
    } else {
        console.log(`⚠️ No competitions found for ${sportToUse}`);
    }
}

/**
 * ==============================
 * ENTRY POINT
 * ==============================
 */
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
