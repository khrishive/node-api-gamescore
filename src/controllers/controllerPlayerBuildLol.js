import { getMapResultsLol, getPickBanLol, getPlayerBuild } from './lolControllers.js';

export function renderPlayerBuildsLol(lolPlayerBuild, lolFixtureData, lolPickBanData, team1, team2) {
    console.log("🔍 lolPlayerBuild:", Array.isArray(lolPlayerBuild) ? lolPlayerBuild.length : typeof lolPlayerBuild);
    console.log("🔍 lolFixtureData:", Array.isArray(lolFixtureData) ? lolFixtureData.length : typeof lolFixtureData);
    console.log("🔍 lolPickBanData:", lolPickBanData ? Object.keys(lolPickBanData) : "undefined");

    if (!lolPlayerBuild?.length || !lolFixtureData?.length || !lolPickBanData?.pickBan?.length) {
        console.log('No data available');
        return [];
    }

    const maps = {};

    // 🔹 Paso 1: Construcción base de los mapas
    lolFixtureData.forEach(mapEntry => {
        const mapNumber = mapEntry.map_number;
        const mapName = `Map ${mapNumber}`;
        const teamsRaw = {};

        // Obtener teams por map
        const teamIds = [...new Set(lolPlayerBuild
            .filter(p => p.map_number === mapNumber)
            .map(p => p.team_id))];

        teamIds.forEach(teamId => {
            // Picks y bans
            const teamPicks = [];
            const teamBans = [];

            (lolPickBanData.pickBan || []).forEach(pb => {
                if (pb.mapNumber === mapNumber && pb.teamId === teamId) {
                    if (pb.type === 'pick') teamPicks.push(pb.heroId);
                    else if (pb.type === 'ban') teamBans.push(pb.heroId);
                }
            });

            // Jugadores
            const players = lolPlayerBuild
                .filter(p => p.map_number === mapNumber && p.team_id === teamId)
                .map(p => ({
                    playerId: p.player_playerId,
                    name: p.name,
                    position: p.player_position,
                    level: p.player_level,
                    champion_id: p.player_championId,
                    items: [
                        p.player_item_0, p.player_item_1, p.player_item_2,
                        p.player_item_3, p.player_item_4, p.player_item_5
                    ].filter(Boolean),
                    trinket: p.player_trinket,
                    runes: [
                        p.player_runes0, p.player_runes1, p.player_runes2,
                        p.player_runes3, p.player_runes4, p.player_runes5,
                        p.player_runes6, p.player_runes7, p.player_runes8
                    ].filter(Boolean),
                    summoner_spell_1: p.player_summonerSpell1,
                    summoner_spell_2: p.player_summonerSpell2,
                    summoner_spell_1_id: p.player_summonerSpell1Id,
                    summoner_spell_2_id: p.player_summonerSpell2Id,
                    visionScore: p.player_visionScore,
                    controlWards: p.player_controlWardsPurchased,
                    wardsPlaced: p.player_wardsPlaced,
                    wardsKilled: p.player_wardsKilled,
                }));

            teamsRaw[teamId] = {
                id: teamId,
                picks: teamPicks,
                bans: teamBans,
                players,
            };
        });

        maps[mapNumber] = {
            map_name: mapName,
            teams: [
                { ...team1, ...(teamsRaw[team1.id] || {}) },
                { ...team2, ...(teamsRaw[team2.id] || {}) },
            ],
        };
    });

    // 🔹 Paso 2: Enriquecer con estadísticas
    lolFixtureData.forEach(mapData => {
        const mapNumber = mapData.map_number;
        if (!maps[mapNumber]) return;

        const mapPlayers = lolFixtureData.filter(m => m.map_number === mapNumber);
        const teamIds = [...new Set(mapPlayers.map(m => m.team_id))];

        teamIds.forEach(teamId => {
            const teamStats = lolFixtureData.filter(p => p.team_id === teamId && p.map_number === mapNumber);
            const teamKills = teamStats.reduce((sum, p) => sum + (p.kills || 0), 0);

            maps[mapNumber].teams.forEach(teamRef => {
                if (teamRef.id !== teamId) return;

                teamRef.players.forEach(player => {
                    const stat = lolFixtureData.find(
                        s => s.player_id === player.playerId && s.map_number === mapNumber
                    );
                    if (stat) {
                        player.kills = stat.kills ?? 0;
                        player.deaths = stat.deaths ?? 0;
                        player.assists = stat.assists ?? 0;
                        player.gold = stat.gold ?? 0;
                        player.damage = stat.championDamage ?? 0;
                        player.cs = stat.cs ?? 0;
                        player.kp = teamKills > 0
                            ? Number((((player.kills + player.assists) / teamKills) * 100).toFixed(3))
                            : 0;
                    }
                });
            });
        });
    });

    return Object.values(maps);
}

// 🔹 Controlador principal
export async function mainPlayerBuild(fixture_id, team1, team2) {
    const [mapResultsLol, pickBanLol, playerBuildLol] = await Promise.all([
        getMapResultsLol(fixture_id),
        getPickBanLol(fixture_id),
        getPlayerBuild(fixture_id),
    ]);

    return renderPlayerBuildsLol(playerBuildLol, mapResultsLol, pickBanLol, team1, team2);
}

(async () => {
  const fixtureId = 950332;

  // Define tus equipos (los ids deben existir en los datos que ya tienes)
  const team1 = { id: 223728, name: 'Team Blue' };
  const team2 = { id: 229552, name: 'Team Red' };

  const result = await mainPlayerBuild(fixtureId, team1, team2);

  console.dir(result, { depth: null });
})();