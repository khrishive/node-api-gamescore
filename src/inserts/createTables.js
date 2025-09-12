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
    // competitions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS competitions (
        id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Waiting for information',
        sport_alias VARCHAR(50) NOT NULL,
        start_date BIGINT NOT NULL DEFAULT 9999999999999,
        end_date BIGINT NOT NULL DEFAULT 9999999999999,
        prize_pool_usd INT DEFAULT 0,
        location VARCHAR(100) NOT NULL DEFAULT 'Waiting for information',
        organizer VARCHAR(100) NOT NULL DEFAULT 'Waiting for information',
        type VARCHAR(50) NOT NULL DEFAULT 'Waiting for information',
        fixture_count INT DEFAULT 0,
        description TEXT NOT NULL,
        no_participants INT DEFAULT 0,
        stage VARCHAR(100) NOT NULL DEFAULT 'Waiting for information',
        time_of_year VARCHAR(100) NOT NULL DEFAULT 'Waiting for information',
        year VARCHAR(100) NOT NULL DEFAULT 'Waiting for information',
        series VARCHAR(100) NOT NULL DEFAULT 'Waiting for information',
        tier VARCHAR(100) NOT NULL DEFAULT 'Waiting for information',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // fixture_links table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS fixture_links (
        fixture_id BIGINT,
        rel VARCHAR(50),
        link VARCHAR(255),
        INDEX (fixture_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // fixtures table
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

    // participants table
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

    // player table
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

    // stats_player table
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

    // team_info table
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

    // team_fixture_stats table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS team_fixture_stats (
        id BIGINT NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        fixture_id BIGINT NOT NULL,
        stats JSON DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY fixture_id (fixture_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // cs_match_events table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS cs_match_events (
        id BIGINT NOT NULL AUTO_INCREMENT,
        fixture_id BIGINT NOT NULL,
        snapshot_number INT DEFAULT NULL,
        sort_index BIGINT DEFAULT NULL,
        event_type VARCHAR(50) DEFAULT NULL,
        name VARCHAR(50) DEFAULT NULL,
        map_name VARCHAR(100) DEFAULT NULL,
        map_number INT DEFAULT NULL,
        half_number INT DEFAULT NULL,
        round_number INT DEFAULT NULL,
        event_timestamp BIGINT DEFAULT NULL,
        actor_id VARCHAR(20) DEFAULT NULL,
        actor_name VARCHAR(255) DEFAULT NULL,
        actor_team_id VARCHAR(20) DEFAULT NULL,
        actor_side VARCHAR(20) DEFAULT NULL,
        victim_id VARCHAR(20) DEFAULT NULL,
        victim_name VARCHAR(255) DEFAULT NULL,
        victim_team_id VARCHAR(20) DEFAULT NULL,
        victim_side VARCHAR(20) DEFAULT NULL,
        weapon VARCHAR(50) DEFAULT NULL,
        kill_id VARCHAR(100) DEFAULT NULL,
        headshot TINYINT(1) DEFAULT NULL,
        penetrated TINYINT(1) DEFAULT NULL,
        no_scope TINYINT(1) DEFAULT NULL,
        through_smoke TINYINT(1) DEFAULT NULL,
        while_blinded TINYINT(1) DEFAULT NULL,
        winner_team_id VARCHAR(20) DEFAULT NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
    `);

    // map_team_players table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS map_team_players (
        id INT NOT NULL AUTO_INCREMENT,
        fixture_id INT NOT NULL,
        map_number INT NOT NULL,
        map_name VARCHAR(50) DEFAULT NULL,
        team_id BIGINT NOT NULL,
        player_id BIGINT NOT NULL,
        player_name VARCHAR(50) DEFAULT NULL,
        kills INT DEFAULT NULL,
        deaths INT DEFAULT NULL,
        assists INT DEFAULT NULL,
        plus_minus INT DEFAULT NULL,
        adr FLOAT DEFAULT NULL,
        headshot_percent FLOAT DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY unique_player_map (fixture_id, map_number, player_id),
        UNIQUE KEY unique_fixture_map_team_player (fixture_id, map_number, team_id, player_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
    `);

    // map_team_round_scores table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS map_team_round_scores (
        id INT NOT NULL AUTO_INCREMENT,
        fixture_id INT NOT NULL,
        map_number INT NOT NULL,
        map_name VARCHAR(50) DEFAULT NULL,
        team_id BIGINT NOT NULL,
        rounds_won TINYINT UNSIGNED NOT NULL,
        half1_score TINYINT UNSIGNED NOT NULL,
        half2_score TINYINT UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        is_pick TINYINT(1) DEFAULT 0,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_fixture_map_team (fixture_id, map_number, team_id),
        KEY idx_fixture_map_team (fixture_id, map_number, team_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
    `);

    // team_stats table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS team_stats (
        id INT NOT NULL AUTO_INCREMENT,
        team_id INT NOT NULL,
        competition_id INT NOT NULL,
        total_fixtures INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
    `);

    // team_stats_breakdown table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS team_stats_breakdown (
        id INT NOT NULL AUTO_INCREMENT,
        team_stats_id INT NOT NULL,
        map_name VARCHAR(50) NOT NULL,
        played INT NOT NULL,
        w INT NOT NULL,
        l INT NOT NULL,
        win_pct DECIMAL(5,2) NOT NULL,
        PRIMARY KEY (id),
        KEY team_stats_id (team_stats_id),
        CONSTRAINT team_stats_breakdown_ibfk_1 FOREIGN KEY (team_stats_id) REFERENCES team_stats (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
    `);

    console.log(`✅ Tables created successfully in the database for the sport: ${sport}`);
  } catch (error) {
    console.error(`❌ Error creating tables for ${sport}:`, error.message);
  }
}

// Only create tables for the selected sport
import { parentPort, workerData } from 'worker_threads';

async function main(sport) {
    await createTables(sport);
}

if (parentPort) {
    main(workerData.sport).then(() => {
        parentPort.postMessage('Tables created successfully.');
    });
} else {
    main(process.argv[2]).then(() => {
        console.log('Tables created successfully.');
    });
}