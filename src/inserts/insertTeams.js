import axios from 'axios';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

const API_URL = `${process.env.GAME_SCORE_API}/teams`;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

async function fetchTeamInfo(id) {
    try {
        const response = await axios.get(`${API_URL}/${id}`, {
            headers: {
                Authorization: AUTH_TOKEN,
            }
        });
        return response.data || {};
    } catch (error) {
        console.error(`❌ Error al obtener datos de la API para id ${id}:`, error.message);
        return {};
    }
}

async function fetchUniqueParticipants() {
    try {
        const response = await axios.get('https://esport-data.com/db/fixtures');
        const data = response.data;
        const participantIds = [];

        for (const fixture of data) {
            if ('participants0_id' in fixture) {
                participantIds.push(fixture.participants0_id);
            }
            if ('participants1_id' in fixture) {
                participantIds.push(fixture.participants1_id);
            }
        }

        const uniqueParticipantIds = Array.from(new Set(participantIds));
        return uniqueParticipantIds;
    } catch (error) {
        console.error('Error fetching fixtures:', error.message);
        return [];
    }
}

function extractLineup(lineup) {
    // Devuelve un array plano de [player_id_0, player_name_0, ..., player_id_4, player_name_4]
    const result = [];
    for (let i = 0; i < 5; i++) {
        if (lineup && lineup[i]) {
            result.push(lineup[i].id ? String(lineup[i].id) : null);
            result.push(lineup[i].name ? String(lineup[i].name) : null);
        } else {
            result.push(null, null);
        }
    }
    return result;
}

async function saveParticipant(connection, team) {
    const lineup = extractLineup(team.most_recent_lineup);

    const sql = `
        REPLACE INTO participants (
            id, name, sport, country, countryISO, region,
            player_id_0, player_name_0,
            player_id_1, player_name_1,
            player_id_2, player_name_2,
            player_id_3, player_name_3,
            player_id_4, player_name_4
        ) VALUES (?, ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        team.id ? String(team.id) : null,
        team.name || null,
        team.sport || null,
        team.country || null,
        team.countryISO || null,
        team.region || null,
        ...lineup
    ];

    try {
        await connection.execute(sql, values);
        console.log(`✅ Guardado equipo ${team.name} (${team.id})`);
    } catch (error) {
        console.error(`❌ Error guardando equipo ${team.id}:`, error.message);
    }
}

async function main() {
    const uniqueIds = await fetchUniqueParticipants();
    const connection = await mysql.createConnection(dbConfig);

    for (const id of uniqueIds) {
        const teamInfo = await fetchTeamInfo(id);
        if (teamInfo && teamInfo.id) {
            await saveParticipant(connection, teamInfo);
        }
    }

    await connection.end();
    console.log('✅ Proceso completado.');
}

main();