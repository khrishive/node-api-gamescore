//Este archivo trae directamente de la API los jugadores participantes en cada torneo,
//los cuenta, y los inserta en el campo "no_participants" de la tabla competitions.

import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';

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

// Use sport-specific table if desired
const COMPETITIONS_TABLE = `competitions`;

const API_URL = `${process.env.GAME_SCORE_API}/competitions`;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

export async function actualizarParticipantes() {
    const connection = await mysql.createConnection({
        ...dbConfig,
        multipleStatements: true
    });
    console.log(`🔄 Actualizando participantes para el deporte: ${SPORT}`);
    try {
        // Paso 1: Obtener todos los competitionIds de la tabla "competitions"
        const [competitions] = await connection.execute(`SELECT id FROM ${COMPETITIONS_TABLE}`);

        // Paso 2: Obtener todos los participantes y guardar en un array
        const updates = [];
        for (const competition of competitions) {
            const competitionId = competition.id;
            try {
                const { data } = await axios.get(`${API_URL}/${competitionId}/participants`, {
                    headers: {
                        Authorization: AUTH_TOKEN,
                    },
                    timeout: 15000, // 15 segundos
                });

                const no_participants = Array.isArray(data.participants) ? data.participants.length : 0;
                console.log(`🏆 competitionId ${competitionId} tiene ${no_participants} participantes.`);
                updates.push([no_participants, competitionId]);
            } catch (error) {
                console.error(`❌ Error al consultar participantes de competitionId ${competitionId}:`, error.message);
            }
        }

        // Paso 3: Bulk update usando múltiples sentencias UPDATE
        if (updates.length > 0) {
            // Build all UPDATE statements
            const sqlStatements = updates.map(
                ([count, id]) => `UPDATE ${COMPETITIONS_TABLE} SET no_participants = ${mysql.escape(count)} WHERE id = ${mysql.escape(id)};`
            ).join('\n');

            // Enable multiple statements for this connection
            await connection.query({ sql: sqlStatements, multipleStatements: true });
            console.log(`✅ Bulk update completado para ${updates.length} competitions.`);
        } else {
            console.log('⚠️ No hay actualizaciones para aplicar.');
        }
    } catch (error) {
        console.error('❌ Error general al actualizar los participantes:', error);
    } finally {
        await connection.end();
    }
}

await actualizarParticipantes();