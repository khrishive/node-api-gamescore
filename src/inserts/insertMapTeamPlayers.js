import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import axios from 'axios';

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
const db = await mysql.createPool(dbConfig);

const API_URL = process.env.GAME_SCORE_API;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

async function getFixtureIds() {
  // 📅 Hoy 00:00:00
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // 📅 Mañana 00:00:00
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  // 🔢 Convertimos a timestamp en milisegundos
  const startTimestamp = startOfToday.getTime();
  const endTimestamp = startOfTomorrow.getTime();

  const [rows] = await db.query(
    `
      SELECT id 
      FROM fixtures 
      WHERE 
        (start_time BETWEEN ? AND ?)
        OR 
        (scheduled_start_time BETWEEN ? AND ?)
    `,
    [startTimestamp, endTimestamp, startTimestamp, endTimestamp]
  );

  return rows.map(row => row.id);
}


async function fetchMapTeamPlayers(fixtureId) {
  try {
    // 1️⃣ Obtener fixture principal (esto sí es obligatorio)
    const response = await axios.get(`${API_URL}/fixtures/${fixtureId}`, {
      headers: { Authorization: AUTH_TOKEN }
    });
    const fixtureData = response.data;

    // 2️⃣ Intentar obtener pickBan (si falla, seguimos con vacío)
    let pickBanData = { pickBan: [] };
    try {
      const pickBan = await axios.get(`${API_URL}/pickban/${fixtureId}/maps`, {
        headers: { Authorization: AUTH_TOKEN }
      });
      pickBanData = pickBan.data;
    } catch (err) {
      if (err.response?.status === 404) {
        console.warn(`[INFO] Pick/Ban no encontrado para fixture ${fixtureId}, continuando...`);
      } else {
        console.error(`[ERROR] Pick/Ban para fixture ${fixtureId}:`, err.message);
      }
    }

    if (!fixtureData?.maps || !Array.isArray(fixtureData.maps)) {
      return { teamStatsResult: [], teamRoundScores: [] };
    }

    // Crear mapa de picks { mapNameLower: teamId }
    const pickMap = {};
    for (const item of pickBanData.pickBan || []) {
      if (item.pickOrBan === 'pick' && item.teamId) {
        pickMap[item.mapName.toLowerCase()] = item.teamId;
      }
    }

    const teamStatsResult = [];
    const teamRoundScores = [];

    for (const map of fixtureData.maps) {
      const mapNumber = map.mapNumber;
      const mapName = map.mapName;

      // ---- Stats de jugadores ----
      for (const team of map.teamStats || []) {
        const teamId = team.teamId ?? 0;

        for (const player of team.players || []) {
          const kills = player.kills ?? 0;
          const deaths = player.deaths ?? 0;
          const headshots = player.headshots ?? 0;
          const plusMinus = kills - deaths;
          const headshotPercent = kills > 0 ? (headshots / kills) * 100 : 0;

          teamStatsResult.push([
            fixtureId,
            mapNumber,
            mapName,
            teamId,
            player.playerId,
            player.name,
            kills,
            deaths,
            player.assists ?? 0,
            plusMinus,
            player.adr ?? 0,
            headshotPercent,
          ]);
        }
      }

      // ---- Rondas de equipos ----
      for (const team of map.roundScores || []) {
        const teamId = team.id ?? 0;
        const roundsWon = team.roundsWon ?? 0;
        const half1 = team.halfScores?.[0] ?? 0;
        const half2 = team.halfScores?.[1] ?? 0;

        // Normalizar nombre de mapa para comparar picks
        const normalizeMapName = name => name.toLowerCase().replace(/^de_/, '');
        const mapKey = normalizeMapName(mapName);
        const pickTeamId = pickMap[mapKey] ?? null;
        const isPick = pickTeamId === teamId;

        teamRoundScores.push([
          fixtureId,
          mapNumber,
          mapName,
          teamId,
          roundsWon,
          half1,
          half2,
          isPick ? 1 : 0
        ]);
      }
    }

    return {
      teamStatsResult,
      teamRoundScores
    };

  } catch (error) {
    console.error(`[ERROR] Fixture ${fixtureId}:`, error.message);
    return { teamStatsResult: [], teamRoundScores: [] };
  }
}


async function insertMapTeamPlayers({ teamStatsResult, teamRoundScores }) {
  try {
    // Insert map_team_players
    if (teamStatsResult.length > 0) {
      const playerQuery = `
        INSERT INTO map_team_players (
          fixture_id, map_number, map_name, team_id, player_id, player_name,
          kills, deaths, assists, plus_minus, adr, headshot_percent
        ) VALUES ?
        ON DUPLICATE KEY UPDATE
          player_name = VALUES(player_name),
          kills = VALUES(kills),
          deaths = VALUES(deaths),
          assists = VALUES(assists),
          plus_minus = VALUES(plus_minus),
          adr = VALUES(adr),
          headshot_percent = VALUES(headshot_percent)
      `;

      await db.query(playerQuery, [teamStatsResult]);
      console.log(`[✓] Insertados ${teamStatsResult.length} registros en map_team_players`);
    }

    // Insert map_team_round_scores
    if (teamRoundScores.length > 0) {
      const roundQuery = `
        INSERT INTO map_team_round_scores (
          fixture_id, map_number, map_name, team_id, rounds_won, half1_score, half2_score, is_pick
        ) VALUES ?
        ON DUPLICATE KEY UPDATE
          rounds_won = VALUES(rounds_won),
          half1_score = VALUES(half1_score),
          half2_score = VALUES(half2_score),
          is_pick = VALUES(is_pick)
      `;

      await db.query(roundQuery, [teamRoundScores]);
      console.log(`[✓] Insertados ${teamRoundScores.length} registros en map_team_round_scores`);
    }

  } catch (err) {
    console.error(`[ERROR INSERT]`, err.message);
  }
}

async function main() {
  const fixtureIds = await getFixtureIds();

  for (const fixtureId of fixtureIds) {
    console.log(`Procesando fixture ${fixtureId}`);
    const data = await fetchMapTeamPlayers(fixtureId);
    await insertMapTeamPlayers(data);
  }

  console.log('✓ Proceso finalizado');
  process.exit();
}

main();
