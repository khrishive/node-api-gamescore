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

const API_URL = `${process.env.GAME_SCORE_API}/fixtures`;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

// Use sport-specific table if desired
const FIXTURES_TABLE = `fixtures`;

/**
 * Llamada a la API para obtener los fixtures de una fecha específica.
 */
async function fetchFixtures(from, to, page = 1) {
    try {
        const response = await axios.get(API_URL, {
            headers: {
                Authorization: AUTH_TOKEN,
            },
            params: { sport: SPORT, from, to, page },
        });
        return {
            fixtures: response.data.fixtures || [],
            totalCount: response.data.totalCount || 0
        };
    } catch (error) {
        console.error(`❌ Error al obtener datos de la API para el rango ${from} a ${to}, página ${page}:`, error.message);
        return { fixtures: [], totalCount: 0 };
    }
}

/**
 * Guardar fixtures en la base de datos.
 */
async function saveFixturesToDB(fixtures) {
    const connection = await mysql.createConnection(dbConfig);

    const fixtureQuery = `
        INSERT INTO ${FIXTURES_TABLE} (
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
            console.log(`✅ Fixture guardado: ${fixture.id}`);
        }
    } catch (error) {
        console.error('❌ Error al guardar en la base de datos:', error.message);
    } finally {
        await connection.end();
    }
}

/**
 * Procesa rangos de fechas, obtiene fixtures y los guarda en la base de datos.
 */
export async function processFixtures(endDate) {
    console.log(`🔄 Generando rangos de fechas para el deporte: ${SPORT}...`);
    const currentDate = new Date().toISOString().slice(0, 10);

    // If endDate is not provided, set it to the last day of the current year
    if (!endDate) {
        const now = new Date();
        const lastDayOfYear = new Date(now.getFullYear(), 11, 31); // December is month 11
        endDate = lastDayOfYear.toISOString().slice(0, 10);
    }

    let page = 1;
    let allFixtures = [];
    let keepPaging = true;

    while (keepPaging) {
        console.log(
            `🔄 Obteniendo fixtures para el rango: ${currentDate} a ${endDate}, página ${page}`
        );
        const { fixtures, totalCount } = await fetchFixtures(
            currentDate,
            endDate,
            page
        );

        if (fixtures.length > 0) {
            allFixtures = allFixtures.concat(fixtures);
        }

        // If totalCount is 50, there may be more pages
        if (totalCount === 50) {
            page += 1;
        } else {
            keepPaging = false;
        }
    }

    if (allFixtures.length > 0) {
        console.log(`📥 ${allFixtures.length} fixtures encontrados, guardando en la base de datos...`);
        await saveFixturesToDB(allFixtures);
    } else {
        console.log(
            `⚠️ No se encontraron fixtures para el rango: ${currentDate} a ${endDate}`
        );
    }

    console.log("✅ Proceso completado.");
}

import { parentPort, workerData } from 'worker_threads';

async function main(sport) {
    await processFixtures(sport);
}

if (parentPort) {
    main(workerData.sport).then(() => {
        parentPort.postMessage('Fixtures insertados exitosamente.');
    });
} else {
    main(process.argv[2]).then(() => {
        console.log('Fixtures insertados exitosamente.');
    });
}