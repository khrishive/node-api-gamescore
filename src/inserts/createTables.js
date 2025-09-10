import { dbCS2, dbLOL } from '../db.js';

/**
 * Helper to get the correct DB connection based on sport
 */
function getDbBySport(sport = 'cs2') {
  if (sport === 'lol') return dbLOL;
  return dbCS2;
}

// Get sport from CLI argument or default to 'cs2'
const sport = process.argv[2] || 'cs2';

export async function createTables(sport = 'cs2') {
  const db = getDbBySport(sport);

  try {
    // Tabla competitions
    await db.execute(`
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
        no_participants INT,
        stage VARCHAR(50),
        time_of_year VARCHAR(50),
        year VARCHAR(50),
        series VARCHAR(200),
        tier VARCHAR(50),
        updated_at DATETIME
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // Tabla fixture_links
    await db.execute(`
      CREATE TABLE IF NOT EXISTS fixture_links (
        fixture_id BIGINT,
        rel VARCHAR(50),
        link VARCHAR(255),
        INDEX (fixture_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // Tabla fixtures
    await db.execute(`
      CREATE TABLE IF NOT EXISTS fixtures (
        id BIGINT PRIMARY KEY,
        competition_id BIGINT,
        competition_name VARCHAR(255),
        end_time BIGINT,
        format_name VARCHAR(50),
        format_value INT,
        scheduled_start_time BIGINT,
        sport_alias VARCHAR(50),
        sport_name VARCHAR(50),
        start_time BIGINT,
        status VARCHAR(50),
        tie TINYINT(1),
        winner_id BIGINT,
        participants0_id VARCHAR(50),
        participants0_name VARCHAR(50),
        participants0_score VARCHAR(50),
        participants1_name VARCHAR(50),
        participants1_id VARCHAR(50),
        participants1_score VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // Tabla participants
    await db.execute(`
      CREATE TABLE IF NOT EXISTS participants (
        id BIGINT PRIMARY KEY,
        fixture_id BIGINT,
        name VARCHAR(255),
        score INT,
        scoreWithoutHandicap INT,
        handicap INT,
        sport VARCHAR(50),
        country VARCHAR(50),
        countryISO VARCHAR(50),
        region VARCHAR(50),
        player_id_0 VARCHAR(50),
        player_name_0 VARCHAR(50),
        player_id_1 VARCHAR(50),
        player_name_1 VARCHAR(50),
        player_id_2 VARCHAR(50),
        player_name_2 VARCHAR(50),
        player_id_3 VARCHAR(50),
        player_name_3 VARCHAR(50),
        player_id_4 VARCHAR(50),
        player_name_4 VARCHAR(50),
        INDEX (fixture_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // Tabla player
    await db.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // Tabla stats_player
    await db.execute(`
      CREATE TABLE IF NOT EXISTS stats_player (
        player_id BIGINT PRIMARY KEY,
        team_id BIGINT,
        player_name VARCHAR(255),
        fixture_count INT,
        maps_count INT,
        round_count INT,
        average_per_round JSON,
        meta JSON
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // Tabla team_info
    await db.execute(`
      CREATE TABLE IF NOT EXISTS team_info (
        id BIGINT PRIMARY KEY,
        name VARCHAR(255),
        sport VARCHAR(50),
        country VARCHAR(255),
        countryISO VARCHAR(10),
        region VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    console.log(`✅ Tablas creadas exitosamente en la base de datos para el deporte: ${sport}`);
  } catch (error) {
    console.error(`❌ Error al crear las tablas para ${sport}:`, error.message);
  }
}

// Only create tables for the selected sport
import { parentPort, workerData } from 'worker_threads';

async function main(sport) {
    await createTables(sport);
}

if (parentPort) {
    main(workerData.sport).then(() => {
        parentPort.postMessage('Tablas creadas exitosamente.');
    });
} else {
    main(process.argv[2]).then(() => {
        console.log('Tablas creadas exitosamente.');
    });
}