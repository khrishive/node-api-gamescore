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

// Función para obtener los IDs únicos de la tabla player
async function fetchPlayerIds() {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT DISTINCT id FROM player');
    await connection.end();
    return rows.map(row => row.id);
}

// Función para obtener las estadísticas del jugador desde la API
async function fetchPlayerStats(id) {
    try {
        const response = await axios.get(`http://localhost:3000/api/players/stats/player/${id}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error al obtener estadísticas del jugador para el ID ${id}:`, error.message);
        return null;
    }
}

// Función para guardar las estadísticas del jugador en la base de datos
async function savePlayerStatsToDB(playerStats) {
    const connection = await mysql.createConnection(dbConfig);

    const statsQuery = `
        INSERT INTO stats_player (player_id, team_id, player_name, fixture_count, maps_count, round_count, average_per_round, meta)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            team_id = VALUES(team_id),
            player_name = VALUES(player_name),
            fixture_count = VALUES(fixture_count),
            maps_count = VALUES(maps_count),
            round_count = VALUES(round_count),
            average_per_round = VALUES(average_per_round),
            meta = VALUES(meta);
    `;

    try {
        // Guardar estadísticas del jugador
        await connection.execute(statsQuery, [
            playerStats.playerId,
            playerStats.teamId,
            playerStats.playerName,
            playerStats.fixtureCount,
            playerStats.mapsCount,
            playerStats.roundCount,
            JSON.stringify(playerStats.averagePerRound),
            JSON.stringify(playerStats.meta)
        ]);

        console.log(`✅ Estadísticas guardadas para el jugador: ${playerStats.playerName}`);
    } catch (error) {
        console.error('❌ Error al guardar en la base de datos:', error.message);
    } finally {
        await connection.end();
    }
}

(async () => {
    console.log('🔄 Obteniendo IDs de jugadores...');
    const playerIds = await fetchPlayerIds();

    for (const id of playerIds) {
        console.log(`🔄 Obteniendo estadísticas del jugador para el ID: ${id}`);
        const playerStats = await fetchPlayerStats(id);

        if (playerStats) {
            console.log(`📥 Guardando estadísticas del jugador para el ID: ${id}`);
            await savePlayerStatsToDB(playerStats);
        } else {
            console.log(`⚠️ No se encontró información de estadísticas para el ID: ${id}`);
        }
    }
})();