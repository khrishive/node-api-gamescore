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

async function fetchCompetitions() {
    try {
        const response = await axios.get('http://localhost:3000/api/competitions?sport=cs2');
        return response.data.competitions || [];
    } catch (error) {
        console.error('❌ Error al obtener datos de la API:', error.message);
        return [];
    }
}

async function saveCompetitionsToDB(competitions) {
    const connection = await mysql.createConnection(dbConfig);
    
    const query = `
        INSERT INTO competitions (id, name, sport_alias, start_date, end_date, prize_pool_usd, location, organizer, type, fixture_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            sport_alias = VALUES(sport_alias),
            start_date = VALUES(start_date),
            end_date = VALUES(end_date),
            prize_pool_usd = VALUES(prize_pool_usd),
            location = VALUES(location),
            organizer = VALUES(organizer),
            type = VALUES(type),
            fixture_count = VALUES(fixture_count);
    `;

    try {
        for (const comp of competitions) {
            await connection.execute(query, [
                comp.id,
                comp.name,
                comp.sportAlias,
                comp.startDate,
                comp.endDate,
                comp.prizePoolUSD,
                comp.location,
                comp.organizer,
                comp.type,
                comp.fixtureCount
            ]);
            console.log(`✅ Competición guardada: ${comp.name}`);
        }
    } catch (error) {
        console.error('❌ Error al guardar en la base de datos:', error.message);
    } finally {
        await connection.end();
    }
}

(async () => {
    console.log('🔄 Obteniendo competiciones...');
    const competitions = await fetchCompetitions();
    
    if (competitions.length > 0) {
        console.log(`📥 ${competitions.length} competiciones encontradas, guardando en la base de datos...`);
        await saveCompetitionsToDB(competitions);
        console.log('✅ Datos guardados correctamente.');
    } else {
        console.log('⚠️ No se encontraron competiciones.');
    }
})();