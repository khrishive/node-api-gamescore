import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: cprocess.env.DB_NAME,
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

async function saveFixturesToDB(fixtures) {
    const connection = await mysql.createConnection(dbConfig);
    
    const fixtureQuery = `
        INSERT INTO fixtures (id, competition_id, competition_name, endTime, format_name, format_value, scheduledStartTime, sport_alias, sport_name, startTime, status, tie, winnerId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            competition_id = VALUES(competition_id),
            competition_name = VALUES(competition_name),
            endTime = VALUES(endTime),
            format_name = VALUES(format_name),
            format_value = VALUES(format_value),
            scheduledStartTime = VALUES(scheduledStartTime),
            sport_alias = VALUES(sport_alias),
            sport_name = VALUES(sport_name),
            startTime = VALUES(startTime),
            status = VALUES(status),
            tie = VALUES(tie),
            winnerId = VALUES(winnerId);
    `;

    const participantQuery = `
        INSERT INTO participants (id, fixture_id, name, score, scoreWithoutHandicap, handicap)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            fixture_id = VALUES(fixture_id),
            name = VALUES(name),
            score = VALUES(score),
            scoreWithoutHandicap = VALUES(scoreWithoutHandicap),
            handicap = VALUES(handicap);
    `;

    const linkQuery = `
        INSERT INTO fixture_links (fixture_id, rel, link)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
            rel = VALUES(rel),
            link = VALUES(link);
    `;

    try {
        for (const fixture of fixtures) {
            // Guardar fixture
            await connection.execute(fixtureQuery, [
                fixture.id,
                fixture.competition.id,
                fixture.competition.name,
                fixture.endTime,
                fixture.format.name,
                fixture.format.value,
                fixture.scheduledStartTime,
                fixture.sport.alias,
                fixture.sport.name,
                fixture.startTime,
                fixture.status,
                fixture.tie,
                fixture.winnerId
            ]);

            // Guardar participantes
            for (const participant of fixture.participants) {
                await connection.execute(participantQuery, [
                    participant.id,
                    fixture.id,
                    participant.name,
                    participant.score,
                    participant.scoreWithoutHandicap,
                    participant.handicap
                ]);
            }

            // Guardar enlaces
            for (const link of fixture.links) {
                await connection.execute(linkQuery, [
                    fixture.id,
                    link.rel,
                    link.link
                ]);
            }

            console.log(`✅ Fixture guardado: ${fixture.id}`);
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
        await saveFixturesToDB(fixtures);
        console.log('✅ Datos guardados correctamente.');
    } else {
        console.log('⚠️ No se encontraron fixtures.');
    }
})();