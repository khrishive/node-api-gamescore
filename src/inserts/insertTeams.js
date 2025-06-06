// Importa las dependencias necesarias
import axios from 'axios';           // Cliente HTTP para hacer peticiones a APIs externas
import dotenv from 'dotenv';         // Permite cargar variables de entorno desde un archivo .env
import mysql from 'mysql2/promise';  // Cliente MySQL con soporte para promesas

// Carga las variables de entorno definidas en el archivo .env
dotenv.config();

// Configuración de la conexión a la base de datos MySQL usando variables de entorno
const dbConfig = {
    host: process.env.DB_HOST,         // Host de la base de datos
    user: process.env.DB_USER,         // Usuario de la base de datos
    password: process.env.DB_PASSWORD, // Contraseña de la base de datos
    database: process.env.DB_NAME,     // Nombre de la base de datos
};

// Constantes para la API de equipos
const API_URL = `${process.env.GAME_SCORE_API}/teams`;         // URL base de la API de equipos
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;  // Token de autenticación para la API
const DB_SERVER_TOKEN = process.env.API_KEY; 



/**
 * Obtiene la información de un equipo usando su ID desde la API externa.
 * @ param {string|number} id - El ID del equipo a consultar.
 * @ returns {Promise<Object>} - Retorna un objeto con la información del equipo o un objeto vacío en caso de error.
 */
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

/**
 * Obtiene los IDs únicos de participantes de la API de fixtures.
 * @ returns {Promise<string[]>} - Retorna un array de IDs únicos de participantes.
 */
async function fetchUniqueParticipants() {
    console.log('trayendo fixtures de esport-data.com');
    try {
        const response = await axios.get('https://esport-data.com/db/all_fixture', {
            headers: {
                'x-api-key' : DB_SERVER_TOKEN,
            }
        });
        console.log(`${response} :v`);
        const data = response.data;
        console.log(data);
        const participantIds = [];

        // Itera sobre cada fixture para extraer los IDs de los participantes (si existen)
        for (const fixture of data) {
            if ('participants0_id' in fixture) {
                participantIds.push(fixture.participants0_id);
            }
            if ('participants1_id' in fixture) {
                participantIds.push(fixture.participants1_id);
            }
        }

        // Elimina IDs duplicados usando un Set
        const uniqueParticipantIds = Array.from(new Set(participantIds));
        return uniqueParticipantIds;
    } catch (error) {
        console.error('Error fetching fixtures:', error.message);
        return [];
    }
}

/**
 * Extrae los IDs y nombres de los jugadores del lineup de un equipo.
 * Devuelve un array plano: [player_id_0, player_name_0, ..., player_id_4, player_name_4]
 * @ param {Array} lineup - Arreglo de jugadores (puede contener hasta 5 jugadores).
 * @ returns {Array} - Array plano con los IDs y nombres de los jugadores, o null si falta.
 */
function extractLineup(lineup) {
    const result = [];
    for (let i = 0; i < 5; i++) {
        if (lineup && lineup[i]) {
            result.push(lineup[i].id ? String(lineup[i].id) : null);    // ID del jugador
            result.push(lineup[i].name ? String(lineup[i].name) : null); // Nombre del jugador
        } else {
            result.push(null, null); // Si falta el jugador, agrega dos nulos
        }
    }
    return result;
}

/**
 * Guarda (o actualiza) la información de un equipo en la tabla participants de la base de datos.
 * Usa REPLACE INTO para insertar o actualizar el registro según el ID.
 * @ param {Object} connection - Conexión MySQL.
 * @ param {Object} team - Objeto con la información del equipo.
 */
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

    // Prepara los valores para la consulta SQL
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

/**
 * Función principal: obtiene los IDs de equipos únicos, consulta la info de cada equipo,
 * y la guarda en la base de datos.
 */
export async function main() {
    const uniqueIds = await fetchUniqueParticipants();                // 1. Obtener IDs únicos de participantes
    const connection = await mysql.createConnection(dbConfig);        // 2. Conectarse a la base de datos

    // 3. Para cada equipo, obtener info y guardar en la base de datos
    for (const id of uniqueIds) {
        const teamInfo = await fetchTeamInfo(id);
        if (teamInfo && teamInfo.id) {
            await saveParticipant(connection, teamInfo);
        }
    }

    await connection.end();                                           // 4. Cerrar conexión a la base de datos
    console.log('✅ Proceso completado.');
}

// Ejecuta el script principal
await main();