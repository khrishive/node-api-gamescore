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

// Encabezado para las solicitudes a la API
const apiHeaders = {
    headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJob3RzcGF3bi5jb20iLCJpc3MiOiJHYW1lU2NvcmVrZWVwZXIiLCJqdGkiOi02MzExOTMxODQyNjM3NTgyNTg4LCJjdXN0b21lciI6dHJ1ZX0.QHVEIBZMYxkq9IiUHFqq3SCz9qncrk-jMtjorQBcbss',
    },
};

// Función para obtener las competiciones desde la API
async function fetchCompetitions() {
    try {
        const response = await axios.get('https://api.gamescorekeeper.com/v1/competitions?sport=cs2', apiHeaders);
        console.log('Competitions API Response:', response.data); // Verifica la estructura de la respuesta
        return response.data || [];
    } catch (error) {
        console.error('❌ Error al obtener competiciones de la API:', error.message);
        return [];
    }
}

// Función para obtener las fixtures desde la API
async function fetchFixtures() {
    try {
        const response = await axios.get('https://api.gamescorekeeper.com/v1/fixtures?sport=cs2', apiHeaders);
        return response.data.fixtures || [];
    } catch (error) {
        console.error('❌ Error al obtener fixtures de la API:', error.message);
        return [];
    }
}

// Función para guardar los participantes de las fixtures
async function saveTeamFixtureStats(fixturesByCompetition) {
    const connection = await mysql.createConnection(dbConfig);

    // Query para guardar la información en la tabla team_fixture_stats
    const teamStatsQuery = `
        INSERT INTO team_fixture_stats (team_id, team_name, fixture_id, team_score, did_win)
        VALUES (?, ?, ?, ?, ?);
    `;

    try {
        for (const [competitionId, fixtures] of Object.entries(fixturesByCompetition)) {
            console.log(`📦 Procesando competition_id: ${competitionId} con ${fixtures.length} fixtures`);

            for (const fixture of fixtures) {
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
            }

            console.log(`✅ Datos guardados para competition_id: ${competitionId}`);
        }
    } catch (error) {
        console.error('❌ Error al guardar en la base de datos:', error.message);
    } finally {
        await connection.end();
    }
}

// Función principal
(async () => {
    console.log('🔄 Obteniendo competiciones...');
    const competitions = await fetchCompetitions();

    if (competitions.length === 0) {
        console.log('⚠️ No se encontraron competiciones.');
        return;
    }

    const competitionIds = competitions.map(competition => competition.id);
    console.log(`📥 ${competitionIds.length} competiciones encontradas.`);

    console.log('🔄 Obteniendo fixtures...');
    const fixtures = await fetchFixtures();

    if (fixtures.length === 0) {
        console.log('⚠️ No se encontraron fixtures.');
        return;
    }

    // Organizar las fixtures por competition_id
    const fixturesByCompetition = fixtures.reduce((acc, fixture) => {
        const competitionId = fixture.competition.id;

        if (!acc[competitionId]) {
            acc[competitionId] = [];
        }

        acc[competitionId].push(fixture);
        return acc;
    }, {});

    console.log('📊 Fixtures organizadas por competition_id.');

    // Guardar la información en la base de datos
    await saveTeamFixtureStats(fixturesByCompetition);
    console.log('✅ Datos guardados correctamente.');
})();