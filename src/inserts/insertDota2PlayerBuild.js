//src/inserts/insertDota2PlayerBuild.js

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_URL = process.env.GAME_SCORE_API;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

/**
 * Fetch + parse Dota2 players build
 */
export async function fetchDota2PlayersBuild(fixtureId) {
  try {
    const response = await axios.get(
      `${API_URL}/fixtures/${fixtureId}/stats`,
      { headers: { Authorization: AUTH_TOKEN } }
    );

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
          buildData.push([
            fixtureId,                              // fixture_id
            mapNumber,                              // map_number
            teamId,                                 // team_id
            player.name ?? 'Unknown',               // name
            player.role ?? null,                    // role

            JSON.stringify(player.items ?? []),     // player_item
            player.level ?? null,                   // player_level
            player.xpMin ?? null,                   // xpMin
            player.heroId ?? null,                  // heroId
            player.stunTime ?? null,                // stunTime
            player.firstBlood ? 1 : 0,              // firstBlood

            JSON.stringify(player.skillOrder ?? []),// skillOrder
            player.timeToLvl6 ?? null,              // timeToLvl6
            JSON.stringify(player.xpByMinute ?? []),// xpByMinute
            player.bountyRunes ?? null,             // bountyRunes
            player.neutralItem ?? null,             // neutralItem
            player.roshanKills ?? null,             // roshanKills
            player.towerDamage ?? null,             // towerDamage
            player.campsStacked ?? null,            // campsStacked

            JSON.stringify(player.goldByMinute ?? []), // goldByMinute
            player.aghanimsShard ? 1 : 0,            // aghanimsShard
            JSON.stringify(player.backpackItems ?? []), // backpackItems

            player.creepsStacked ?? null,           // creepsStacked
            player.damageReceived ?? null,          // damageReceived
            JSON.stringify(player.deniesByMinute ?? []), // deniesByMinute

            player.runesCollected ?? null,          // runesCollected
            player.aghanimsScepter ? 1 : 0,          // aghanimsScepter
            JSON.stringify(player.lastHitsByMinute ?? []), // lastHitsByMinute

            player.sentryWardsKilled ?? null,       // sentryWardsKilled
            player.sentryWardsPlaced ?? null,       // sentryWardsPlaced
            player.observerWardsKilled ?? null,     // observerWardsKilled
            player.observerWardsPlaced ?? null,     // observerWardsPlaced
            player.supportContribution ?? null      // supportContribution
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
 * Insert en dota2_players_build
 */
export async function insertDota2PlayersBuild(db, { buildData }) {
  try {
    if (!buildData.length) return;

    const query = `
      INSERT INTO dota2_players_build (
        fixture_id,
        map_number,
        team_id,
        name,
        role,
        player_item,
        player_level,
        xpMin,
        heroId,
        stunTime,
        firstBlood,
        skillOrder,
        timeToLvl6,
        xpByMinute,
        bountyRunes,
        neutralItem,
        roshanKills,
        towerDamage,
        campsStacked,
        goldByMinute,
        aghanimsShard,
        backpackItems,
        creepsStacked,
        damageReceived,
        deniesByMinute,
        runesCollected,
        aghanimsScepter,
        lastHitsByMinute,
        sentryWardsKilled,
        sentryWardsPlaced,
        observerWardsKilled,
        observerWardsPlaced,
        supportContribution
      ) VALUES ?
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        role = VALUES(role),
        player_item = VALUES(player_item),
        player_level = VALUES(player_level),
        xpMin = VALUES(xpMin),
        stunTime = VALUES(stunTime),
        firstBlood = VALUES(firstBlood),
        skillOrder = VALUES(skillOrder),
        timeToLvl6 = VALUES(timeToLvl6),
        xpByMinute = VALUES(xpByMinute),
        bountyRunes = VALUES(bountyRunes),
        neutralItem = VALUES(neutralItem),
        roshanKills = VALUES(roshanKills),
        towerDamage = VALUES(towerDamage),
        campsStacked = VALUES(campsStacked),
        goldByMinute = VALUES(goldByMinute),
        aghanimsShard = VALUES(aghanimsShard),
        backpackItems = VALUES(backpackItems),
        creepsStacked = VALUES(creepsStacked),
        damageReceived = VALUES(damageReceived),
        deniesByMinute = VALUES(deniesByMinute),
        runesCollected = VALUES(runesCollected),
        aghanimsScepter = VALUES(aghanimsScepter),
        lastHitsByMinute = VALUES(lastHitsByMinute),
        sentryWardsKilled = VALUES(sentryWardsKilled),
        sentryWardsPlaced = VALUES(sentryWardsPlaced),
        observerWardsKilled = VALUES(observerWardsKilled),
        observerWardsPlaced = VALUES(observerWardsPlaced),
        supportContribution = VALUES(supportContribution)
    `;

    await db.query(query, [buildData]);

    console.log(
      `[✓] Upserted ${buildData.length} player builds into dota2_players_build`
    );
  } catch (err) {
    console.error('[INSERT ERROR]', err.message);
  }
}
