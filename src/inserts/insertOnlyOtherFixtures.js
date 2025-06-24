import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT', 'GAME_SCORE_API', 'GAME_SCORE_APIKEY'];
requiredEnv.forEach(name => {
  if (!process.env[name]) throw new Error(`❌ Falta la variable de entorno ${name}`);
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
 * Generar rangos de fechas día por día entre dos fechas.
 */
function generateDateRanges(startDate, endDate) {
    const ranges = [];
    let currentDate = new Date(startDate);

    while (currentDate <= new Date(endDate)) {
        const from = currentDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        const to = from; // El mismo día para from y to
        ranges.push({ from, to });

        // Incrementar en un día
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return ranges;
}

/**
 * Llamada a la API para obtener los fixtures de una fecha específica.
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
        console.error(`❌ Error al obtener datos de la API para el rango ${from} a ${to}:`, error.message);
        return [];
    }
}

/**
 * Guardar fixtures en la base de datos.
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
 * @ param {string} [endDate='2025-11-03'] - Fecha de fin para los rangos.
 */
export async function processFixtures(endDate = '2025-06-17') {
    console.log('🔄 Generando rangos de fechas...');
    const today = new Date(2023, 1, 1);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Los meses son 0-indexados
    const dd = String(today.getDate()).padStart(2, '0');
    const currentDate = `${yyyy}-${mm}-${dd}`;
    const dateRanges = generateDateRanges(currentDate, endDate);

    for (const range of dateRanges) {
        console.log(`🔄 Obteniendo fixtures para el rango: ${range.from} a ${range.to}`);

        const fixtures = await fetchFixtures(range.from, range.to);

        if (fixtures.length > 0) {
            console.log(`📥 ${fixtures.length} fixtures encontrados, guardando en la base de datos...`);
            await saveFixturesToDB(fixtures);
        } else {
            console.log(`⚠️ No se encontraron fixtures para la fecha: ${range.from}`);
        }
    }

    console.log('✅ Proceso completado.');
}

await processFixtures()