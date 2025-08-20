import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';
import {getTournamentsInARangeOfDates} from '../../test4.js';
import {getParticipantsByTournamentId} from '../services/getNoParticipantsFromTournaments.js';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
};

const API_URL = 'https://api.gamescorekeeper.com/v1/competitions?sport=cs2';
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;



// Paso 1: Obtener competiciones
async function fetchCompetitions() {
    try {
      
        
        const response = await axios.get(API_URL, {
              headers: {
                Authorization: AUTH_TOKEN
              }
            });

        const startDate = '2025-01-01';
        const endDate = '2025-12-31';

        try {
            const filtered = getTournamentsInARangeOfDates(
            response.data.competitions,
                startDate,
                endDate
            );

            return filtered; // <-- Retornar solo los filtrados
        } catch (error) {
            if (error.response) {
                console.error('Statuss:', error.response.status);
                console.error('Dataa:', error.response.data);
            } else if (error.request) {
                console.error('No response receivedd:', error.request);
            } else {
                console.error('Errorr', error.message);
            }
            return [];
        }
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
            location, organizer, type, fixture_count,
            stage, time_of_year, year, series, tier,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
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
            updated_at = NOW();
    `;

    const updateParticipantsQuery = `
        UPDATE competitions SET no_participants = ? WHERE id = ?
    `;

    for (const comp of competitions) {
        try {
            const derivatives = comp.derivatives || {};
            const metadata = comp.metadata || {};

            await connection.execute(insertQuery, [
                comp.id,
                comp.name || null,
                comp.sportAlias || null,
                comp.startDate || null,
                comp.endDate || null,
                comp.prizePoolUSD || null,
                comp.location || null,
                comp.organizer || null,
                comp.type || null,
                comp.fixtureCount || null,
                derivatives.stage || 'Waiting for information',
                derivatives.time_of_year || 'Waiting for information',
                derivatives.year || 'Waiting for information',
                derivatives.series || 'Waiting for information',
                metadata.liquipediaTier || 'Waiting for information'
            ]);

            console.log(`✅ Guardado torneo: ${comp.name}`);

            // Obtener y guardar participantes
            const participantRes = await getParticipantsByTournamentId(comp.id);
            const no_participants = participantRes?.uniqueParticipantCount || 0;

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
