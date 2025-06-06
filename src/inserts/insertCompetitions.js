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

const API_URL = `${process.env.GAME_SCORE_API}/competitions`;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

async function fetchCompetitions() {
    try {
        const response = await axios.get(API_URL, {
            headers: {
                Authorization: AUTH_TOKEN,
            }
        });
        return response.data.competitions || [];
    } catch (error) {
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error', error.message);
        }
        // Retorna siempre un array vacío si hay error
        return [];
    }
}


async function saveCompetitionsToDB(competitions) {
    const connection = await mysql.createConnection(dbConfig);
    
    const query = `
        INSERT INTO competitions (id, name, sport_alias, start_date, end_date, prize_pool_usd, location, organizer, type, fixture_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            sport_alias = VALUES(sport_alias),
            start_date = VALUES(start_date),
            end_date = VALUES(end_date),
            prize_pool_usd = VALUES(prize_pool_usd),
            location = VALUES(location),
            organizer = VALUES(organizer),
            type = VALUES(type),
            fixture_count = VALUES(fixture_count);
    `;

    try {
        for (const comp of competitions) {
            await connection.execute(query, [
                comp.id,
                comp.name,
                comp.sportAlias,
                comp.startDate,
                comp.endDate,
                comp.prizePoolUSD,
                comp.location,
                comp.organizer,
                comp.type,
                comp.fixtureCount
            ]);
            console.log(`✅ Competición guardada: ${comp.name}`);
        }
    } catch (error) {
        console.error('❌ Error al guardar en la base de datos:', error.message);
    } finally {
        await connection.end();
    }
}

// Exporta una función que obtiene competiciones y las guarda en la base de datos
export async function getAndSaveCompetitions() {
    console.log('🔄 Obteniendo competiciones...');
    const competitions = await fetchCompetitions();
    
    if (competitions.length > 0) {
        console.log(`📥 ${competitions.length} competiciones encontradas, guardando en la base de datos...`);
        await saveCompetitionsToDB(competitions);
        console.log('✅ Datos guardados correctamente.');
    } else {
        console.log('⚠️ No se encontraron competiciones.');
    }
}

await getAndSaveCompetitions()