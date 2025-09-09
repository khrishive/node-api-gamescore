import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';
//import { getParticipantsByTournamentId } from '../services/getNoParticipantsFromTournaments.js';

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

const API_URL = `${process.env.GAME_SCORE_API}/competitions`;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

// Choose table name based on sport
const COMPETITIONS_TABLE = `competitions`;

// Fetch competitions for the selected sport
async function fetchCompetitions() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
    const endDate = new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0];

    try {
        const response = await axios.get(`${API_URL}?sport=${SPORT}&from=${startDate}&to=${endDate}`, {
            headers: { Authorization: AUTH_TOKEN }
        });
        console.log(`🔍 Competitions fetched from API for sport '${SPORT}':`, response.data.competitions);
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

async function saveCompetitionsToDB(competitions) {
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

    const updateParticipantsQuery = `
        UPDATE ${COMPETITIONS_TABLE}
        SET no_participants = ?
        WHERE id = ?
    `;

    try {
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

        await pool.query(insertCompetitionsQuery, [competitionValues]);
        console.log(`✅ Inserted/updated ${competitionValues.length} competitions in table ${COMPETITIONS_TABLE}`);

        /*
        for (const comp of competitions) {
            try {
                const participantRes = await getParticipantsByTournamentId(comp.id);
                const no_participants = participantRes?.uniqueParticipantCount || 0;
                await pool.query(updateParticipantsQuery, [no_participants, comp.id]);
                console.log(`👥 Updated no_participants for ${comp.id}: ${no_participants}`);
            } catch (err) {
                console.error(`❌ Failed to update participants for ${comp.id}:`, err.message);
            }
        }
        */

    } catch (error) {
        console.error("❌ saveCompetitionsToDB failed:", error.message);
    } finally {
        await pool.end();
    }
}

export async function getAndSaveCompetitions() {
    console.log(`🔄 getAndSaveCompetitions for sport: ${SPORT}`);
    const competitions = await fetchCompetitions();
    console.log(`🔄 Filtered competitions for ${SPORT}: ${competitions.length}`);
    if (competitions.length > 0) {
        await saveCompetitionsToDB(competitions);
        console.log(`✅ All competitions for ${SPORT} processed.`);
    } else {
        console.log(`⚠️ No competitions found for sport: ${SPORT}`);
    }
}

await getAndSaveCompetitions();