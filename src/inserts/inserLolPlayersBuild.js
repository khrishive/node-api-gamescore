import dotenv from 'dotenv';
import axios from 'axios';
import { getDbBySport } from '../utils/dbUtils.js';

dotenv.config();

const API_URL = process.env.GAME_SCORE_API;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

/**
 * Obtiene todos los fixture_id del deporte dado (LOL)
 */
async function getFixtureIds(db) {
  const sportAlias = 'lol';
  const [rows] = await db.query(
    `SELECT id FROM fixtures WHERE sport_alias = ?`,
    [sportAlias]
  );
  return rows.map(r => r.id);
}

/**
 * Descarga la data de jugadores de cada mapa/fixture
 * y la transforma al formato listo para insertar en MySQL
 */
async function fetchLolPlayersBuild(fixtureId) {
  try {
    const response = await axios.get(`${API_URL}/fixtures/${fixtureId}/stats`, {
      headers: { Authorization: AUTH_TOKEN }
    });

    const data = response.data;
    if (!data?.maps || !Array.isArray(data.maps)) {
      return { buildData: [] };
    }

    const buildData = [];

    for (const map of data.maps) {
      const mapNumber = map.mapNumber ?? 0;

      for (const team of map.teamStats || []) {
        const teamId = team.teamId ?? 0;

        for (const player of team.players || []) {
          const items = player.items || [];
          const runes = player.runes || [];

          buildData.push([
            fixtureId,                               // fixture_id
            mapNumber,                               // map_number
            teamId,                                  // team_id
            player.name ?? 'Unknown',                // name
            items[0] ?? null,                        // player_item_0
            items[1] ?? null,
            items[2] ?? null,
            items[3] ?? null,
            items[4] ?? null,
            items[5] ?? null,
            player.level ?? 0,                       // player_level
            runes[0] ?? null,                        // player_runes0
            runes[1] ?? null,
            runes[2] ?? null,
            runes[3] ?? null,
            runes[4] ?? null,
            runes[5] ?? null,
            runes[6] ?? null,
            runes[7] ?? null,
            runes[8] ?? null,
            player.trinket ?? null,                  // player_trinket
            player.playerId ?? null,                 // player_playerId
            player.position ?? null,                 // player_position
            player.championId ?? null,               // player_championId
            player.visionScore ?? 0,                 // player_visionScore
            player.wardsKilled ?? 0,                 // player_wardsKilled
            player.wardsPlaced ?? 0,                 // player_wardsPlaced
            player.summonerSpell1 ?? null,           // player_summonerSpell1
            player.summonerSpell2 ?? null,           // player_summonerSpell2
            player.summonerSpell1Id ?? null,         // player_summonerSpell1Id
            player.summonerSpell2Id ?? null,         // player_summonerSpell2Id
            player.controlWardsPurchased ?? 0        // player_controlWardsPurchased
          ]);
        }
      }
    }

    return { buildData };
  } catch (error) {
    console.error(`[ERROR] Fixture ${fixtureId}:`, error.message);
    return { buildData: [] };
  }
}

/**
 * Inserta los datos procesados en la tabla lol_players_build
 */
async function insertLolPlayersBuild(db, { buildData }) {
  try {
    if (buildData.length === 0) return;

    const query = `
  INSERT INTO lol_players_build (
    fixture_id,
    map_number,
    team_id,
    name,
    player_item_0,
    player_item_1,
    player_item_2,
    player_item_3,
    player_item_4,
    player_item_5,
    player_level,
    player_runes0,
    player_runes1,
    player_runes2,
    player_runes3,
    player_runes4,
    player_runes5,
    player_runes6,
    player_runes7,
    player_runes8,
    player_trinket,
    player_playerId,
    player_position,
    player_championId,
    player_visionScore,
    player_wardsKilled,
    player_wardsPlaced,
    player_summonerSpell1,
    player_summonerSpell2,
    player_summonerSpell1Id,
    player_summonerSpell2Id,
    player_controlWardsPurchased
  )
  VALUES ?
  ON DUPLICATE KEY UPDATE
    team_id = VALUES(team_id),
    player_item_0 = VALUES(player_item_0),
    player_item_1 = VALUES(player_item_1),
    player_item_2 = VALUES(player_item_2),
    player_item_3 = VALUES(player_item_3),
    player_item_4 = VALUES(player_item_4),
    player_item_5 = VALUES(player_item_5),
    player_level = VALUES(player_level),
    player_runes0 = VALUES(player_runes0),
    player_runes1 = VALUES(player_runes1),
    player_runes2 = VALUES(player_runes2),
    player_runes3 = VALUES(player_runes3),
    player_runes4 = VALUES(player_runes4),
    player_runes5 = VALUES(player_runes5),
    player_runes6 = VALUES(player_runes6),
    player_runes7 = VALUES(player_runes7),
    player_runes8 = VALUES(player_runes8),
    player_trinket = VALUES(player_trinket),
    player_playerId = VALUES(player_playerId),
    player_position = VALUES(player_position),
    player_championId = VALUES(player_championId),
    player_visionScore = VALUES(player_visionScore),
    player_wardsKilled = VALUES(player_wardsKilled),
    player_wardsPlaced = VALUES(player_wardsPlaced),
    player_summonerSpell1 = VALUES(player_summonerSpell1),
    player_summonerSpell2 = VALUES(player_summonerSpell2),
    player_summonerSpell1Id = VALUES(player_summonerSpell1Id),
    player_summonerSpell2Id = VALUES(player_summonerSpell2Id),
    player_controlWardsPurchased = VALUES(player_controlWardsPurchased)
`;


    await db.query(query, [buildData]);
    console.log(`[✓] Inserted ${buildData.length} player builds into lol_players_build`);
  } catch (err) {
    console.error(`[INSERT ERROR]`, err.message);
  }
}

/**
 * Proceso principal: obtiene fixtures, descarga data e inserta builds
 */
export async function processLolPlayersBuild(sport = 'lol', data) {
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
      const mapData = await fetchLolPlayersBuild(fixtureId);
      await insertLolPlayersBuild(db, mapData);
      console.log(`✅ pick/ban  inserted for fixture ${fixtureId}`);
    } catch (err) {
      console.error(`❌ Error processing fixture ${fixtureId}:`, err.message);
    }
  }


  console.log(`✓ Process finished for ${sport}`);
}

// 🔸 Permite ejecutar directamente con `node lolPlayersBuildInserter.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  const sportArg = process.argv[2] || 'lol';
  processLolPlayersBuild(sportArg).catch(err => {
    console.error("Error during direct execution:", err.message);
    process.exit(1);
  });
}
