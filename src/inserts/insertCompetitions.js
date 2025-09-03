import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';
import {getParticipantsByTournamentId} from '../services/getNoParticipantsFromTournaments.js';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
};

const API_URL = 'https://api.gamescorekeeper.com/v1/competitions';
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;
const SPORT='cs2';


// Paso 1: Obtener competiciones
async function fetchCompetitions() {
    // Dynamic dates: Jan 1st of current year → Dec 31st of current year
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1)
        .toISOString()
        .split("T")[0];
    const endDate = new Date(now.getFullYear(), 11, 31)
        .toISOString()
        .split("T")[0];

    try {
        const response = await axios.get(`${API_URL}?sport=${SPORT}&from=${startDate}&to=${endDate}`, {
            headers: { Authorization: AUTH_TOKEN }
        });

        // Filter competitions
        return response.data.competitions;
    } catch (error) {
        // Unified error handling
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


async function saveCompetitionsToDB(competitions) {
    const pool = mysql.createPool(dbConfig);

    const insertCompetitionsQuery = `
        INSERT INTO competitions (
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
            description
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
            description = VALUES(description);
    `;

    const insertParticipantsQuery = `
        INSERT INTO competitions (id, no_participants, updated_at)
        VALUES ?
        ON DUPLICATE KEY UPDATE
            no_participants = VALUES(no_participants),
            updated_at = NOW();
    `;

    try {
        // 1️⃣ Build bulk values for competitions
        const competitionValues = competitions.map(comp => [
            comp.id,
            comp.name || 'TBD',
            comp.sportAlias || null,
            comp.startDate || null,
            comp.endDate || null,
            comp.prizePoolUSD || 0,
            comp.location || null,
            comp.organizer || null,
            comp.type || null,
            comp.fixtureCount || 0,
            comp.derivatives?.stage || null,
            comp.derivatives?.time_of_year || null,
            comp.derivatives?.year || null,
            comp.derivatives?.series || null,
            comp.metadata?.liquipediaTier || null,
            comp.description || null,
        ]);

        // Bulk UPSERT competitions
        await pool.query(insertCompetitionsQuery, [competitionValues]);
        console.log(`✅ Inserted/updated ${competitionValues.length} competitions`);

        // 2️⃣ Fetch participants (API calls per competition)        
        
        const participantsData = [];
        for (const comp of competitions) {
            try {
                const participantRes = await getParticipantsByTournamentId(comp.id);
                const no_participants = participantRes?.uniqueParticipantCount || 0;
                participantsData.push([comp.id, no_participants, new Date()]);
                console.log(`👥 Fetched participants for ${comp.id}: ${no_participants}`);
            } catch (err) {
                console.error(`❌ Failed to fetch participants for ${comp.id}:`, err.message);
            }
        }

        if (participantsData.length > 0) {
            await pool.query(insertParticipantsQuery, [participantsData]);
            console.log(`✅ Updated participants for ${participantsData.length} competitions`);
        }

    } catch (error) {
        console.error("❌ saveCompetitionsToDB failed:", error.message);
    } finally {
        await pool.end();
    }
}


// Función principal
export async function getAndSaveCompetitions() {
    console.log('🔄 getAndSaveCompetitions');
    console.log('🔄 Obteniendo competiciones del año 2025...');
    const competitions = await fetchCompetitions();
    console.log(`🔄 Filtradas competiciones entre 2025-01-01 y 2025-12-31: ${competitions.length}`);
    if (competitions.length > 0) {
        console.log(`📥 ${competitions.length} competiciones encontradas.`);
        await saveCompetitionsToDB(competitions);
        console.log('✅ Todas las competiciones fueron procesadas.');
    } else {
        console.log('⚠️ No se encontraron competiciones.');
    }
}

await getAndSaveCompetitions();
