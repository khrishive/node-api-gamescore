import axios from 'axios';
import dotenv from 'dotenv';
import { getDbBySport } from '../utils/dbUtils.js';

dotenv.config();

const API_URL = `${process.env.GAME_SCORE_API}`;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

/**
 * Gets the unique participant IDs from the DB.
 */
async function fetchParticipantIds(db) {
    const [rows] = await db.execute('SELECT DISTINCT id FROM participants WHERE NOT EXISTS (SELECT 1 FROM player WHERE player.team_id = participants.id)');
    return rows.map(row => row.id);
}

/**
 * Gets team information from the API.
 */
async function fetchTeamInfo(id) {
    try {
        const response = await axios.get(`${API_URL}/teams/${id}`, {
            headers: { Authorization: AUTH_TOKEN }
        });
        return response.data || null;
    } catch (error) {
        console.error(`❌ Error getting team ID ${id}:`, error.message);
        return null;
    }
}

/**
 * Gets player information from the API.
 */
async function fetchPlayerInfo(playerId) {
    try {
        const response = await axios.get(`${API_URL}/players/${playerId}`, {
            headers: { Authorization: AUTH_TOKEN }
        });
        return response.data || null;
    } catch (error) {
        console.error(`❌ Error getting player ID ${playerId}:`, error.message);
        return null;
    }
}

/**
 * Cleans and structures the player data.
 */
function sanitizePlayerData(playerInfo, player, teamId) {
    return {
        id: player.id || null,
        team_id: teamId || null,
        first_name: playerInfo?.firstName || null,
        last_name: playerInfo?.lastName || null,
        nickname: player.name || null,
        age: playerInfo?.age || null,
        country: playerInfo?.country || null,
        countryISO: playerInfo?.countryISO || null,
        sport: playerInfo?.sport || null
    };
}

/**
 * Saves the information of a team's players in the DB.
 */
async function saveTeamInfoToDB(db, teamInfo) {
    const playerQuery = `
        INSERT INTO player (id, team_id, first_name, last_name, nickname, age, country, countryISO, sport)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            nickname = VALUES(nickname),
            age = VALUES(age),
            country = VALUES(country),
            countryISO = VALUES(countryISO),
            sport = VALUES(sport);
    `;

    try {
        if (!teamInfo.most_recent_lineup || !Array.isArray(teamInfo.most_recent_lineup) || teamInfo.most_recent_lineup.length === 0) {
            console.log(`⚠️ Team ${teamInfo.id} (${teamInfo.name}) has no registered lineup`);
            return;
        }

        const playerPromises = teamInfo.most_recent_lineup.map(async (player) => {
            const playerInfo = await fetchPlayerInfo(player.id);
            if (!playerInfo) {
                console.log(`⚠️ No info for player ID: ${player.id}`);
                return;
            }

            const sanitized = sanitizePlayerData(playerInfo, player, teamInfo.id);

            await db.execute(playerQuery, [
                sanitized.id,
                sanitized.team_id,
                sanitized.first_name,
                sanitized.last_name,
                sanitized.nickname,
                sanitized.age,
                sanitized.country,
                sanitized.countryISO,
                sanitized.sport
            ]);

            console.log(`✅ Saved player ${sanitized.nickname} (${sanitized.id})`);
        });

        await Promise.all(playerPromises);

        console.log(`✅ Processed team: ${teamInfo.name} (ID: ${teamInfo.id})`);
    } catch (error) {
        console.error(`❌ Error saving team ${teamInfo.id}:`, error.message);
    }
}


/**
 * Main flow: gets participants, processes each team and saves to DB.
 */
export async function processMissingTeamsAndPlayers(sport = 'cs2') {
    const db = getDbBySport(sport);
    try {
        console.log('🔄 Getting participant IDs...');
        const participantIds = await fetchParticipantIds(db);
        console.log(`🔄 Found ${participantIds.length} teams to process.`);

        for (const id of participantIds) {
            console.log(`🔄 Processing team ID: ${id}`);
            const teamInfo = await fetchTeamInfo(id);

            if (teamInfo) {
                await saveTeamInfoToDB(db, teamInfo);
            } else {
                console.log(`⚠️ No information found for team ID: ${id}`);
            }
        }
    } catch (error) {
        console.error('❌ Error in the main process:', error);
    } finally {
        if (db) {
            await db.end();
        }
    }
}

// If run directly, execute with CLI arguments
if (import.meta.url.includes(process.argv[1])) {
    const sportArg = process.argv[2] || 'cs2';
    processMissingTeamsAndPlayers(sportArg).catch(err => {
        console.error("Error during direct execution:", err.message);
        process.exit(1);
    });
}