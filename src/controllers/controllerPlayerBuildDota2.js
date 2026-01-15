//src/controllers/controllerPlayerBuildDota2.js

import { getMapResultsDota2, getPickBanDota2, getPlayerBuild } from './dota2Controllers.js';

function safeJson(value) {
  try {
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}


export function renderPlayerBuildsdota2(dota2PlayerBuild, dota2FixtureData, dota2PickBanData, team1Id, team2Id) {
    //console.log("🔍 dota2PlayerBuild:", Array.isArray(dota2PlayerBuild) ? dota2PlayerBuild.length : typeof dota2PlayerBuild);
    //console.log("🔍 dota2FixtureData:", Array.isArray(dota2FixtureData) ? dota2FixtureData.length : typeof dota2FixtureData);
    //console.log("🔍 dota2PickBanData:", Array.isArray(dota2PickBanData) ? `Array(${dota2PickBanData.length})` : typeof dota2PickBanData);

    // ✅ Validación
    if (!dota2PlayerBuild?.length || !dota2FixtureData?.length || !dota2PickBanData?.length) {
        console.log('No data available');
        return [];
    }

    const maps = {};

    // 🔹 Paso 1: Construcción base de los mapas
    dota2FixtureData.forEach(mapEntry => {
        const mapNumber = mapEntry.map_number;
        const mapName = `Map ${mapNumber}`;
        const teamsRaw = {};

        // Obtener teams por map
        const teamIds = [...new Set(
            dota2PlayerBuild
                .filter(p => p.map_number === mapNumber)
                .map(p => p.team_id)
        )];

        teamIds.forEach(teamId => {
            // Picks y bans
            const teamPicks = [];
            const teamBans = [];

            (dota2PickBanData || []).forEach(pb => {
                if (pb.mapNumber === mapNumber && pb.teamId === teamId) {
                    if (pb.type === 'pick') teamPicks.push(pb.heroId);
                    else if (pb.type === 'ban') teamBans.push(pb.heroId);
                }
            });

            // Jugadores
            const players = dota2PlayerBuild
            .filter(p => p.map_number === mapNumber && p.team_id === teamId)
            .map(p => ({
                name: p.name,
                role: p.role,
                heroId: p.heroId,
                level: p.player_level,

                items: safeJson(p.player_item),
                backpackItems: safeJson(p.backpackItems),
                skillOrder: safeJson(p.skillOrder),
                xpByMinute: safeJson(p.xpByMinute),
                goldByMinute: safeJson(p.goldByMinute),
                lastHitsByMinute: safeJson(p.lastHitsByMinute),
                deniesByMinute: safeJson(p.deniesByMinute),

                xpMin: p.xpMin,
                timeToLvl6: p.timeToLvl6,
                stunTime: p.stunTime,

                bountyRunes: p.bountyRunes,
                neutralItem: p.neutralItem,
                roshanKills: p.roshanKills,
                towerDamage: p.towerDamage,
                campsStacked: p.campsStacked,
                creepsStacked: p.creepsStacked,
                damageReceived: p.damageReceived,
                runesCollected: p.runesCollected,

                firstBlood: Boolean(p.firstBlood),
                aghanimsShard: Boolean(p.aghanimsShard),
                aghanimsScepter: Boolean(p.aghanimsScepter),

                sentryWardsKilled: p.sentryWardsKilled,
                sentryWardsPlaced: p.sentryWardsPlaced,
                observerWardsKilled: p.observerWardsKilled,
                observerWardsPlaced: p.observerWardsPlaced,
                supportContribution: p.supportContribution,
            }));

            teamsRaw[teamId] = {
                id: teamId,
                picks: teamPicks,
                bans: teamBans,
                players,
            };
        });

        // ✅ En lugar de objetos con .id y .name, usamos IDs directamente
        maps[mapNumber] = {
            map_name: mapName,
            teams: [
                teamsRaw[team1Id] || { id: team1Id, picks: [], bans: [], players: [] },
                teamsRaw[team2Id] || { id: team2Id, picks: [], bans: [], players: [] },
            ],
        };
    });

    // 🔹 Paso 2: Enriquecer con estadísticas
    dota2FixtureData.forEach(mapData => {
        const mapNumber = mapData.map_number;
        if (!maps[mapNumber]) return;

        const mapPlayers = dota2FixtureData.filter(m => m.map_number === mapNumber);
        const teamIds = [...new Set(mapPlayers.map(m => m.team_id))];

        teamIds.forEach(teamId => {
            const teamStats = dota2FixtureData.filter(p => p.team_id === teamId && p.map_number === mapNumber);
            const teamKills = teamStats.reduce((sum, p) => sum + (p.kills || 0), 0);

            maps[mapNumber].teams.forEach(teamRef => {
                if (teamRef.id !== teamId) return;

                teamRef.players.forEach(player => {
                    const stat = dota2FixtureData.find(
                        s => s.player_name === player.name && s.map_number === mapNumber
                    );
                    if (stat) {
                        player.kills = stat.kills ?? 0;
                        player.deaths = stat.deaths ?? 0;
                        player.denies = stat.denies ?? 0;
                        player.gold = stat.gold ?? 0;
                        player.heroDamage = stat.heroDamage ?? 0;
                        player.towersDestroyed = stat.towersDestroyed ?? 0;
                        player.kp = teamKills > 0
                            ? Number((((player.kills + stat.assists) / teamKills) * 100).toFixed(3))
                            : 0;
                    }
                });
            });
        });
    });

    return Object.values(maps);
}

// 🔹 Controlador principal
export async function mainPlayerBuild(fixture_id, team1Id, team2Id) {
    const [mapResultsDota2, pickBanDota2, playerBuildDota2] = await Promise.all([
        getMapResultsDota2(fixture_id),
        getPickBanDota2(fixture_id),
        getPlayerBuild(fixture_id),
    ]);

    return renderPlayerBuildsdota2(playerBuildDota2, mapResultsDota2, pickBanDota2, team1Id, team2Id);
}

// 🔹 Ejecución directa para prueba
(async () => {
  const fixtureId = 972603;

  // 🔸 Ahora son solo IDs numéricos
  const team1Id = 240051;
  const team2Id = 240050;

  const result = await mainPlayerBuild(fixtureId, team1Id, team2Id);

  console.dir(result, { depth: null });
})();
