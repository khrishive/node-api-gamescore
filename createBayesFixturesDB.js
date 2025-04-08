import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: cprocess.env.DB_NAME,
};

async function createDatabaseAndTables() {
    const connection = await mysql.createConnection(dbConfig);

    try {
        // Crear la base de datos
        await connection.execute('CREATE DATABASE IF NOT EXISTS bayes_fixtures');
        await connection.execute('USE bayes_fixtures');

        // Crear tabla competitions
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS competitions (
                id INT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                sport_alias VARCHAR(50) NOT NULL,
                start_date BIGINT NOT NULL,
                end_date BIGINT NOT NULL,
                prize_pool_usd INT,
                location VARCHAR(100),
                organizer VARCHAR(100),
                type VARCHAR(50),
                fixture_count INT,
                description TEXT,
                no_participants INT
            );
        `);

        // Crear tabla fixture_links
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS fixture_links (
                fixture_id BIGINT,
                rel VARCHAR(50),
                link VARCHAR(255),
                INDEX (fixture_id)
            );
        `);

        // Crear tabla fixtures
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS fixtures (
                id BIGINT PRIMARY KEY,
                competition_id BIGINT,
                competition_name VARCHAR(255),
                endTime BIGINT,
                format_name VARCHAR(50),
                format_value INT,
                scheduledStartTime BIGINT,
                sport_alias VARCHAR(50),
                sport_name VARCHAR(50),
                startTime BIGINT,
                status VARCHAR(50),
                tie TINYINT(1),
                winnerId BIGINT
            );
        `);

        // Crear tabla participants
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS participants (
                id BIGINT PRIMARY KEY,
                fixture_id BIGINT,
                name VARCHAR(255),
                score INT,
                scoreWithoutHandicap INT,
                handicap INT,
                INDEX (fixture_id)
            );
        `);

        // Crear tabla player
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS player (
                id BIGINT PRIMARY KEY,
                team_id BIGINT,
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                nickname VARCHAR(255),
                age INT,
                country VARCHAR(255),
                countryISO VARCHAR(10),
                sport VARCHAR(50),
                INDEX (team_id)
            );
        `);

        // Crear tabla stats_player
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS stats_player (
                player_id BIGINT PRIMARY KEY,
                team_id BIGINT,
                player_name VARCHAR(255),
                fixture_count INT,
                maps_count INT,
                round_count INT,
                average_per_round JSON,
                meta JSON
            );
        `);

        // Crear tabla team_info
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS team_info (
                id BIGINT PRIMARY KEY,
                name VARCHAR(255),
                sport VARCHAR(50),
                country VARCHAR(255),
                countryISO VARCHAR(10),
                region VARCHAR(50)
            );
        `);

        console.log('✅ Base de datos y tablas creadas exitosamente.');
    } catch (error) {
        console.error('❌ Error al crear la base de datos y las tablas:', error.message);
    } finally {
        await connection.end();
    }
}

createDatabaseAndTables();