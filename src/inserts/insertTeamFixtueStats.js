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

async function fetchFixtures() {
    try {
        const response = await axios.get('http://localhost:3000/api/fixtures?sport=cs2');
        return response.data.fixtures || [];
    } catch (error) {
        console.error('❌ Error al obtener datos de la API:', error.message);
        return [];
    }
}

async function saveTeamFixtureStats(fixtures) {
    const connection = await mysql.createConnection(dbConfig);

    // Query para guardar la información en la tabla team_fixture_stats
    const teamStatsQuery = `
        INSERT INTO team_fixture_stats (team_id, team_name, fixture_id, team_score, did_win)
        VALUES (?, ?, ?, ?, ?);
    `;

    try {
        for (const fixture of fixtures) {
            // Iterar sobre los participantes del fixture para guardar en team_fixture_stats
            for (const participant of fixture.participants) {
                const didWin = participant.id === fixture.winnerId; // Comparar el ID del participante con el winnerId
                
                await connection.execute(teamStatsQuery, [
                    participant.id,          // team_id
                    participant.name,        // team_name
                    fixture.id,              // fixture_id
                    participant.score,       // team_score
                    didWin                   // did_win
                ]);
            }

            console.log(`✅ Información guardada para el fixture: ${fixture.id}`);
        }
    } catch (error) {
        console.error('❌ Error al guardar en la base de datos:', error.message);
    } finally {
        await connection.end();
    }
}

(async () => {
    console.log('🔄 Obteniendo fixtures...');
    const fixtures = await fetchFixtures();
    
    if (fixtures.length > 0) {
        console.log(`📥 ${fixtures.length} fixtures encontrados, guardando en la base de datos...`);
        await saveTeamFixtureStats(fixtures);
        console.log('✅ Datos guardados correctamente.');
    } else {
        console.log('⚠️ No se encontraron fixtures.');
    }
})();