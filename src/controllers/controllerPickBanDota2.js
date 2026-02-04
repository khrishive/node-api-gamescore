//src/controllers/controllerPickBanDota2.js

import { getMapResultsDota2, getPickBanDota2 } from './dota2Controllers.js';

export function renderPickBanDota2(dota2PickBanData, dota2FixtureData) {
    if (!dota2PickBanData || !dota2FixtureData) {
        console.log('No data available');
        return;
    }

    const pickbanData = dota2PickBanData ?? [];
    const statsData = dota2FixtureData ?? [];

    const maps = {};

    // 🔹 Agrupar picks y bans por mapa y equipo
    for (const pb of pickbanData) {
        const mapNum = pb.map_number;
        const teamId = pb.team_id;

        if (!maps[mapNum]) maps[mapNum] = {};
        if (!maps[mapNum][teamId]) maps[mapNum][teamId] = { picks: [], bans: [] };

        if (pb.type === 'pick') {
            maps[mapNum][teamId].picks.push(pb);
        } else if (pb.type === 'ban') {
            maps[mapNum][teamId].bans.push(pb);
        }
    }

    // 🔹 Procesar estadísticas de equipos y jugadores
    for (const playerData of statsData) {
        const mapNum = playerData.map_number;
        const teamId = playerData.team_id;
        const duration = playerData.duration ?? 0;

        if (!maps[mapNum]) maps[mapNum] = {};
        if (!maps[mapNum][teamId]) maps[mapNum][teamId] = { picks: [], bans: [] };

        if (!maps[mapNum][teamId].stats) {
            maps[mapNum][teamId].stats = {
                kills: 0,
                towers: 0,
                inhibitors: 0,
                barons: 0,
                dragons: 0,
                gold: 0,
                duration
            };
        }

        const teamStats = maps[mapNum][teamId].stats;

        // Sumar estadísticas por jugador
        teamStats.kills += playerData.kills ?? 0;
        teamStats.towers += playerData.towersDestroyed ?? 0;
        teamStats.inhibitors += playerData.inhibitors ?? 0;
        teamStats.barons += playerData.baronKills ?? 0;
        teamStats.dragons += playerData.dragonKills ?? 0;
        teamStats.gold += playerData.gold ?? 0;
    }

    // 🔹 Ordenar mapas por número (ascendente)
    const sortedMaps = Object.keys(maps)
        .sort((a, b) => Number(a) - Number(b))
        .reduce((acc, key) => {
            acc[key] = maps[key];
            return acc;
        }, {});

    //console.dir(sortedMaps, { depth: null });
    return sortedMaps;
}


export async function dota2PickBan(fixture_id) {
    const mapResultsDota2 = await getMapResultsDota2(fixture_id);
    const pickBanDota2 = await getPickBanDota2(fixture_id);

    const result = renderPickBanDota2(pickBanDota2, mapResultsDota2);
    return result;
}

// Ejecutar para probar
//dota2PickBan(972603)