import dotenv from 'dotenv';
import axios from 'axios';
import { getDbBySport } from '../utils/dbUtils.js';

dotenv.config();

const API_URL = process.env.GAME_SCORE_API;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

async function getFixtureIds(db) {

  let sportAlias = 'lol';

  const [rows] = await db.query(
    `
      SELECT id 
      FROM fixtures 
      WHERE 
         sport_alias = ?

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
      return { teamStatsResult: []};
    }

 
    const teamStatsResult = [];

    for (const map of fixtureData.maps) {
      const mapNumber = map.mapNumber;
      const mapName = map.mapName ?? 'Unknown';


      for (const team of map.teamStats || []) {
        const teamId = team.teamId ?? 0;
        const side = team.side;

            for (const player of team.players || []) {
                

                teamStatsResult.push([
                    fixtureId,
                    mapNumber,
                    mapName,
                    teamId,
                    side,
                    player.playerId,
                    player.name,
                    player.cs ?? 0,
                    player.gold ?? 0,
                    player.kills ?? 0,
                    player.deaths ?? 0,
                    player.assists ?? 0,
                    player.goldSpent ?? 0,
                    player.baronKills ?? 0,
                    player.dragonKills ?? 0,
                    player.championDamage ?? 0,
                    player.towersDestroyed ?? 0,
                ]);
            }
        }

      
    }

    return {
      teamStatsResult
    };

  } catch (error) {
    console.error(`[ERROR] Fixture ${fixtureId}:`, error.message);
    return { teamStatsResult: [] };
  }
}

async function insertMapTeamPlayers(db, { teamStatsResult }) {
  try {
    if (teamStatsResult.length === 0) return;

    const playerQuery = `
      INSERT INTO map_team_players (
        fixture_id,
        map_number,
        map_name,
        team_id,
        side,
        player_id,
        player_name,
        cs,
        gold,
        kills,
        deaths,
        assists,
        goldSpent,
        baronKills,
        dragonKills,
        championDamage,
        towersDestroyed
      )
      VALUES ?
      ON DUPLICATE KEY UPDATE
        player_name = VALUES(player_name),
        cs = VALUES(cs),
        gold = VALUES(gold),
        kills = VALUES(kills),
        deaths = VALUES(deaths),
        assists = VALUES(assists),
        goldSpent = VALUES(gold_spent),
        baronKills = VALUES(baron_kills),
        dragonKills = VALUES(dragon_kills),
        championDamage = VALUES(champion_damage),
        towersDestroyed = VALUES(towers_destroyed),
        side = VALUES(side),
        map_name = VALUES(map_name)
    `;

    await db.query(playerQuery, [teamStatsResult]);
    console.log(`[✓] Inserted ${teamStatsResult.length} records into map_team_players`);
  } catch (err) {
    console.error(`[INSERT ERROR]`, err.message);
  }
}


export async function processMapTeamPlayers(sport = 'cs2') {
  const db = getDbBySport(sport);
  const fixtureIds = await getFixtureIds(db);
  console.log(`Found ${fixtureIds.length} fixtures for ${sport} to process.`);

  for (const fixtureId of fixtureIds) {
    console.log(`Processing fixture ${fixtureId}`);
    const data = await fetchMapTeamPlayers(fixtureId);
    await insertMapTeamPlayers(db, data);
  }

  console.log(`✓ Process finished for ${sport}`);
}

// If run directly, execute with CLI arguments
if (import.meta.url === `file://${process.argv[1]}`) {
  const sportArg = process.argv[2] || 'cs2';
  processMapTeamPlayers(sportArg).catch(err => {
    console.error("Error during direct execution:", err.message);
    process.exit(1);
  });
}
