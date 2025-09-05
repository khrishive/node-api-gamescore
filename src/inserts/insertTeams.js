// Importa las dependencias necesarias
import axios from 'axios';           // Cliente HTTP para hacer peticiones a APIs externas
import dotenv from 'dotenv';         // Permite cargar variables de entorno desde un archivo .env
import mysql from 'mysql2/promise';  // Cliente MySQL con soporte para promesas

// Carga las variables de entorno definidas en el archivo .env
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
async function fetchUniqueParticipants(connection) {
    console.log('🔄 Trayendo participantes únicos desde la tabla fixtures...');
    try {
        const [rows] = await connection.execute(
            'SELECT participants0_id, participants1_id FROM fixtures'
        );
        // Flatten and filter unique IDs
        const uniqueIds = [
            ...new Set(
                rows.flatMap(row => [row.participants0_id, row.participants1_id])
                    .filter(id => !!id)
            )
        ];
        console.log(`🎯 ${uniqueIds.length} participantes únicos encontrados.`);
        return uniqueIds;
    } catch (error) {
        console.error('❌ Error trayendo participantes desde la tabla fixtures:', error.message);
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

const pool = mysql.createPool(dbConfig);

/**
 * Función principal: obtiene los IDs de equipos únicos, consulta la info de cada equipo,
 * y la guarda en la base de datos.
 */
export async function main() {
    let connection;
    try {
        connection = await pool.getConnection();
        const uniqueIds = await fetchUniqueParticipants(connection);

        for (const id of uniqueIds) {
            const teamInfo = await fetchTeamInfo(id);
            if (teamInfo && teamInfo.id) {
                await saveParticipant(connection, teamInfo);
            }
        }
        console.log('✅ Proceso completado.');
    } catch (error) {
        console.error('❌ Error en el proceso principal:', error);
    } finally {
        if (connection) await connection.release();
        await pool.end();
    }
}

// Ejecuta el script principal
await main();