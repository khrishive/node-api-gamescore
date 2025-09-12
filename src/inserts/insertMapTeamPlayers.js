import dotenv from 'dotenv';
import axios from 'axios';
import { getDbBySport } from '../utils/dbUtils.js'; // <-- Centralized DB selector

dotenv.config();

// Get sport from command line argument, default to 'cs2'
const sportArg = process.argv[2] || 'cs2';
const SUPPORTED_SPORTS = ['cs2', 'lol'];
const SPORT = SUPPORTED_SPORTS.includes(sportArg) ? sportArg : 'cs2';

// Use centralized DB selector
const db = getDbBySport(SPORT);

const API_URL = process.env.GAME_SCORE_API;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

async function getFixtureIds() {
  // 📅 Today 00:00:00
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // 📅 Tomorrow 00:00:00
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  // 🔢 Convert to timestamp in milliseconds
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
    // 1️⃣ Get main fixture (this is mandatory)
    const response = await axios.get(`${API_URL}/fixtures/${fixtureId}`, {
      headers: { Authorization: AUTH_TOKEN }
    });
    const fixtureData = response.data;

    // 2️⃣ Try to get pickBan (if it fails, we continue with empty)
    let pickBanData = { pickBan: [] };
    try {
      const pickBan = await axios.get(`${API_URL}/pickban/${fixtureId}/maps`, {
        headers: { Authorization: AUTH_TOKEN }
      });
      pickBanData = pickBan.data;
    } catch (err) {
      if (err.response?.status === 404) {
        console.warn(`[INFO] Pick/Ban not found for fixture ${fixtureId}, continuing...`);
      } else {
        console.error(`[ERROR] Pick/Ban for fixture ${fixtureId}:`, err.message);
      }
    }

    if (!fixtureData?.maps || !Array.isArray(fixtureData.maps)) {
      return { teamStatsResult: [], teamRoundScores: [] };
    }

    // Create map of picks { mapNameLower: teamId }
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

      // ---- Player stats ----
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

      // ---- Team rounds ----
      for (const team of map.roundScores || []) {
        const teamId = team.id ?? 0;
        const roundsWon = team.roundsWon ?? 0;
        const half1 = team.halfScores?.[0] ?? 0;
        const half2 = team.halfScores?.[1] ?? 0;

        // Normalize map name to compare picks
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
      console.log(`[✓] Inserted ${teamStatsResult.length} records in map_team_players`);
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
      console.log(`[✓] Inserted ${teamRoundScores.length} records in map_team_round_scores`);
    }

  } catch (err) {
    console.error(`[INSERT ERROR]`, err.message);
  }
}

async function main() {
  const fixtureIds = await getFixtureIds();

  for (const fixtureId of fixtureIds) {
    console.log(`Processing fixture ${fixtureId}`);
    const data = await fetchMapTeamPlayers(fixtureId);
    await insertMapTeamPlayers(data);
  }

  console.log('✓ Process finished');
  process.exit();
}

main();