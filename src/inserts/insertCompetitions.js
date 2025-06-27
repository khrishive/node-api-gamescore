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

const API_BASE = process.env.GAME_SCORE_API;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

// Filtros por año y deporte
const API_URL = `${API_BASE}/competitions?sport=cs2&from=2025-01-01&to=2025-12-31`;

// Paso 1: Obtener competiciones
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
        return [];
    }
}

// Paso 2: Guardar en la DB
async function saveCompetitionsToDB(competitions) {
    const connection = await mysql.createConnection(dbConfig);

    const insertQuery = `
        INSERT INTO competitions (
            id, name, sport_alias, start_date, end_date, prize_pool_usd,
            location, organizer, type, fixture_count, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
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
            updated_at = NOW();
    `;

    const updateParticipantsQuery = `
        UPDATE competitions SET no_participants = ? WHERE id = ?
    `;

    for (const comp of competitions) {
        try {
            await connection.execute(insertQuery, [
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
            console.log(`✅ Guardado torneo: ${comp.name}`);

            // Luego, obtener y guardar los participantes
            const participantRes = await axios.get(`${API_BASE}/competitions/${comp.id}/participants`, {
                headers: { Authorization: AUTH_TOKEN },
                timeout: 15000,
            });

            const no_participants = Array.isArray(participantRes.data.participants)
                ? participantRes.data.participants.length
                : 0;

            await connection.execute(updateParticipantsQuery, [no_participants, comp.id]);
            console.log(`👥 Participantes actualizados: ${no_participants}`);
        } catch (error) {
            if (error.code === 'ECONNRESET') {
                console.error(`❌ ECONNRESET al procesar ${comp.id}`);
            } else if (error.code === 'ECONNABORTED') {
                console.error(`❌ Timeout en ${comp.id}`);
            } else if (error.response) {
                console.error(`❌ Error HTTP ${error.response.status} para ${comp.id}:`, error.response.data);
            } else {
                console.error(`❌ Error inesperado para ${comp.id}:`, error.message);
            }
        }
    }

    await connection.end();
}

// Función principal
export async function getAndSaveCompetitions() {
    console.log('🔄 Obteniendo competiciones del año 2025...');
    const competitions = await fetchCompetitions();

    if (competitions.length > 0) {
        console.log(`📥 ${competitions.length} competiciones encontradas.`);
        await saveCompetitionsToDB(competitions);
        console.log('✅ Todas las competiciones fueron procesadas.');
    } else {
        console.log('⚠️ No se encontraron competiciones.');
    }
}

await getAndSaveCompetitions();
