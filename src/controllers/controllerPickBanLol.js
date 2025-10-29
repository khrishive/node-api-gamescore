import { getMapResultsLol, getPickBanLol } from './lolControllers.js';

export function renderPickBanLol(lolPickBanData, lolFixtureData) {
    if (!lolPickBanData || !lolFixtureData) {
        console.log('No data available');
        return;
    }

    const pickbanData = lolPickBanData ?? [];
    const statsData = lolFixtureData ?? [];

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

    console.dir(sortedMaps, { depth: null });
    return sortedMaps;
}


export async function lolPickBan(fixture_id) {
    const mapResultsLol = await getMapResultsLol(fixture_id);
    const pickBanLol = await getPickBanLol(fixture_id);

    const result = renderPickBanLol(pickBanLol, mapResultsLol);
    return result;
}

// Ejecutar para probar
lolPickBan(950332)