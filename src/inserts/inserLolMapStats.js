import dotenv from 'dotenv';
import axios from 'axios';
import { getDbBySport } from '../utils/dbUtils.js';

dotenv.config();

const API_URL = process.env.GAME_SCORE_API;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

async function getFixtureIds(db) {
  const sportAlias = 'lol';

  const [rows] = await db.query(
    `
      SELECT id 
      FROM fixtures 
      WHERE sport_alias = ?
    `,
    [sportAlias]
  );

  return rows.map(row => row.id);
}

async function fetchMapTeamPlayers(fixtureId) {
  try {
    const response = await axios.get(`${API_URL}/fixtures/${fixtureId}`, {
      headers: { Authorization: AUTH_TOKEN }
    });

    const fixtureData = response.data;

    if (!fixtureData?.maps || !Array.isArray(fixtureData.maps)) {
      return { teamStatsResult: [] };
    }

    const teamStatsResult = [];

    for (const map of fixtureData.maps) {
      const mapNumber = map.mapNumber ?? 0;
      const mapName = map.mapName ?? 'Unknown';
      const duration = map.duration ?? 0;
      const winnerId = map.winnerId ?? null;

      for (const team of map.teamStats || []) {
        const teamId = team.teamId ?? 0;
        const side = team.side ?? null;

        for (const player of team.players || []) {
          teamStatsResult.push([
            fixtureId,
            mapNumber,
            mapName,
            teamId,
            player.playerId,
            player.name ?? 'Unknown',
            side,
            player.cs ?? 0,
            player.gold ?? 0,
            player.goldSpent ?? 0,
            player.baronKills ?? 0,
            player.dragonKills ?? 0,
            player.championDamage ?? 0,
            player.towersDestroyed ?? 0,
            player.kills ?? 0,
            player.deaths ?? 0,
            player.assists ?? 0,
            duration,
            winnerId
          ]);
        }
      }
    }

    return { teamStatsResult };

  } catch (error) {
    console.error(`[ERROR] Fixture ${fixtureId}:`, error.message);
    return { teamStatsResult: [] };
  }
}

async function insertMapTeamPlayers(db, { teamStatsResult }) {
  try {
    if (teamStatsResult.length === 0) return;

    const query = `
      INSERT INTO map_team_players (
        fixture_id,
        map_number,
        map_name,
        team_id,
        player_id,
        player_name,
        side,
        cs,
        gold,
        goldSpent,
        baronKills,
        dragonKills,
        championDamage,
        towersDestroyed,
        kills,
        deaths,
        assists,
        duration,
        winner_id
      )
      VALUES ?
      ON DUPLICATE KEY UPDATE
        player_name = VALUES(player_name),
        side = VALUES(side),
        cs = VALUES(cs),
        gold = VALUES(gold),
        goldSpent = VALUES(goldSpent),
        baronKills = VALUES(baronKills),
        dragonKills = VALUES(dragonKills),
        championDamage = VALUES(championDamage),
        towersDestroyed = VALUES(towersDestroyed),
        kills = VALUES(kills),
        deaths = VALUES(deaths),
        assists = VALUES(assists),
        duration = VALUES(duration),
        winner_id = VALUES(winner_id),
        map_name = VALUES(map_name)
    `;

    await db.query(query, [teamStatsResult]);
    console.log(`[✓] Inserted ${teamStatsResult.length} records into map_team_players`);
  } catch (err) {
    console.error(`[INSERT ERROR]`, err.message);
  }
}

export async function processMapTeamPlayers(sport = 'lol', data) {
  const db = getDbBySport(sport);
  let fixtureIds = [];

  // Si recibimos un objeto con varios deportes
  if (data && typeof data === 'object') {
    // Extraemos solo los IDs del deporte actual (por defecto 'lol')
    fixtureIds = Array.isArray(data[sport]) ? data[sport] : [];
  } else if (Array.isArray(data)) {
    // En caso de que directamente pasen un arreglo
    fixtureIds = data;
  } else {
    // Si no se pasa nada, tomamos los IDs desde la BD
    fixtureIds = await getFixtureIds(db);
  }

  if (!fixtureIds.length) {
    console.log(`⚠️ No fixture IDs found for ${sport}. Skipping.`);
    return;
  }

  console.log(`Found ${fixtureIds.length} fixtures for ${sport} to process.`);

  for (const fixtureId of fixtureIds) {
    console.log(`⚙️ Processing fixture ${fixtureId} (${sport})...`);
    try {
      const mapData = await fetchMapTeamPlayers(fixtureId);
      await insertMapTeamPlayers(db, mapData);
      console.log(`✅ Map team players inserted for fixture ${fixtureId}`);
    } catch (err) {
      console.error(`❌ Error processing fixture ${fixtureId}:`, err.message);
    }
  }

  console.log(`✓ Process finished for ${sport}`);
}



// Ejecutar directamente con argumento opcional de deporte
if (import.meta.url === `file://${process.argv[1]}`) {
  const sportArg = process.argv[2] || 'lol';
  processMapTeamPlayers(sportArg).catch(err => {
    console.error("Error during direct execution:", err.message);
    process.exit(1);
  });
}
