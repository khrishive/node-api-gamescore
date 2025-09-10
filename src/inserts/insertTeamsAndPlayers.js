import axios from 'axios';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

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
const db = await mysql.createPool(dbConfig);

const API_URL = `${process.env.GAME_SCORE_API}`;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

/**
 * Obtiene los IDs únicos de participantes desde la DB.
 */
async function fetchParticipantIds() {
    const [rows] = await db.execute('SELECT DISTINCT id FROM participants');
    return rows.map(row => row.id);
}

/**
 * Obtiene información del equipo desde la API.
 */
async function fetchTeamInfo(id) {
    try {
        const response = await axios.get(`${API_URL}/teams/${id}`, {
            headers: { Authorization: AUTH_TOKEN }
        });
        return response.data || null;
    } catch (error) {
        console.error(`❌ Error al obtener equipo ID ${id}:`, error.message);
        return null;
    }
}

/**
 * Obtiene información del jugador desde la API.
 */
async function fetchPlayerInfo(playerId) {
    try {
        const response = await axios.get(`${API_URL}/players/${playerId}`, {
            headers: { Authorization: AUTH_TOKEN }
        });
        return response.data || null;
    } catch (error) {
        console.error(`❌ Error al obtener jugador ID ${playerId}:`, error.message);
        return null;
    }
}

/**
 * Limpia y estructura los datos del jugador.
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
 * Guarda la información de los jugadores de un equipo en la DB.
 */
async function saveTeamInfoToDB(teamInfo) {
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
            console.log(`⚠️ El equipo ${teamInfo.id} (${teamInfo.name}) no tiene lineup registrado`);
            return;
        }

        const playerPromises = teamInfo.most_recent_lineup.map(async (player) => {
            const playerInfo = await fetchPlayerInfo(player.id);
            if (!playerInfo) {
                console.log(`⚠️ Sin info del jugador ID: ${player.id}`);
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

            console.log(`✅ Guardado jugador ${sanitized.nickname} (${sanitized.id})`);
        });

        await Promise.all(playerPromises);

        console.log(`✅ Equipo procesado: ${teamInfo.name} (ID: ${teamInfo.id})`);
    } catch (error) {
        console.error(`❌ Error al guardar equipo ${teamInfo.id}:`, error.message);
    }
}


/**
 * Flujo principal: obtiene participantes, procesa cada equipo y guarda en DB.
 */
export async function processTeams() {
    console.log('🔄 Obteniendo IDs de participantes...');
    const participantIds = await fetchParticipantIds();

    for (const id of participantIds) {
        console.log(`🔄 Procesando equipo ID: ${id}`);
        const teamInfo = await fetchTeamInfo(id);

        if (teamInfo) {
            await saveTeamInfoToDB(teamInfo);
        } else {
            console.log(`⚠️ No se encontró información del equipo ID: ${id}`);
        }
    }
}

/**
 * Ejecución principal con control global de errores.
 */
import { parentPort, workerData } from 'worker_threads';

async function main(sport) {
    await processTeams(sport);
}

if (parentPort) {
    main(workerData.sport).then(() => {
        parentPort.postMessage('Equipos y jugadores insertados exitosamente.');
    });
} else {
    main(process.argv[2]).then(() => {
        console.log('Equipos y jugadores insertados exitosamente.');
    });
}
