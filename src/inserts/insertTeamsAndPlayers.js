import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

// Función para obtener los IDs únicos de la tabla participants
async function fetchParticipantIds() {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT DISTINCT id FROM participants');
    await connection.end();
    return rows.map(row => row.id);
}

// Función para obtener la información del equipo desde la API
async function fetchTeamInfo(id) {
    try {
        const response = await axios.get(`http://localhost:3000/api/teams/${id}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error al obtener datos del equipo para el ID ${id}:`, error.message);
        return null;
    }
}

// Función para obtener la información del jugador desde la API
async function fetchPlayerInfo(playerId) {
    try {
        const response = await axios.get(`http://localhost:3000/api/players/${playerId}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error al obtener datos del jugador para el ID ${playerId}:`, error.message);
        return null;
    }
}

// Función para sanitizar los datos del jugador
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

// Función para guardar la información del equipo y los jugadores en la base de datos
async function saveTeamInfoToDB(teamInfo) {
    const connection = await mysql.createConnection(dbConfig);

    const teamQuery = `
        INSERT INTO team_info (id, name, sport, country, countryISO, region)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            sport = VALUES(sport),
            country = VALUES(country),
            countryISO = VALUES(countryISO),
            region = VALUES(region);
    `;

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
        // Guardar información del equipo
        await connection.execute(teamQuery, [
            teamInfo.id,
            teamInfo.name,
            teamInfo.sport,
            teamInfo.country,
            teamInfo.countryISO,
            teamInfo.region
        ]);

        // Guardar información de los jugadores
        for (const player of teamInfo.most_recent_lineup) {
            console.log(`📥 Guardando información del jugador: ${JSON.stringify(player)}`);
            const playerInfo = await fetchPlayerInfo(player.id);
            const sanitizedPlayer = sanitizePlayerData(playerInfo, player, teamInfo.id);

            if (playerInfo) {
                await connection.execute(playerQuery, [
                    sanitizedPlayer.id,
                    sanitizedPlayer.team_id,
                    sanitizedPlayer.first_name,
                    sanitizedPlayer.last_name,
                    sanitizedPlayer.nickname,
                    sanitizedPlayer.age,
                    sanitizedPlayer.country,
                    sanitizedPlayer.countryISO,
                    sanitizedPlayer.sport
                ]);
            } else {
                console.log(`⚠️ No se encontró información del jugador para el ID: ${player.id}`);
            }
        }

        console.log(`✅ Información guardada para el equipo: ${teamInfo.name}`);
    } catch (error) {
        console.error('❌ Error al guardar en la base de datos:', error.message);
    } finally {
        await connection.end();
    }
}

(async () => {
    console.log('🔄 Obteniendo IDs de participantes...');
    const participantIds = await fetchParticipantIds();

    for (const id of participantIds) {
        console.log(`🔄 Obteniendo información del equipo para el ID: ${id}`);
        const teamInfo = await fetchTeamInfo(id);

        if (teamInfo) {
            console.log(`📥 Guardando información del equipo para el ID: ${id}`);
            await saveTeamInfoToDB(teamInfo);
        } else {
            console.log(`⚠️ No se encontró información del equipo para el ID: ${id}`);
        }
    }
})();