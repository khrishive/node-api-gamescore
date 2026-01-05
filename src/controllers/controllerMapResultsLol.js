//src/controllers/controllerMapResultsLol.js

import { getMapResultsLol, getPickBanLol } from './lolControllers.js';

function renderMapResultsLOL(lolPickBanData, lolFixtureData) {
    if (!lolPickBanData || !lolFixtureData) {
        console.log('No data available');
        return;
    }

    const mapsData = {};

    // 🔹 1. Procesar picks
    lolPickBanData
        .filter(entry => entry.type === 'pick')
        .forEach(entry => {
            const { map_number, team_id, hero_id } = entry;

            if (!mapsData[map_number]) {
                mapsData[map_number] = { teams: {}, picks: {}, duration: null, winnerId: null };
            }

            if (!mapsData[map_number].teams[team_id]) {
                mapsData[map_number].teams[team_id] = { picks: [], kills: 0, gold: 0 };
            }

            mapsData[map_number].teams[team_id].picks.push(hero_id);
        });

    // 🔹 2. Procesar resultados del mapa
    lolFixtureData.forEach(row => {
        const {
            map_number,
            duration,
            winner_id,
            team_id,
            kills,
            gold,
        } = row;

        const formatDuration = secs => {
            const h = Math.floor(secs / 3600);
            const m = Math.floor((secs % 3600) / 60);
            const s = secs % 60;
            return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        // Asegurar que el mapa exista
        if (!mapsData[map_number]) {
            mapsData[map_number] = { teams: {}, duration: null, winnerId: null };
        }

        // Crear el equipo si no existe
        if (!mapsData[map_number].teams[team_id]) {
            mapsData[map_number].teams[team_id] = { picks: [], kills: 0, gold: 0 };
        }

        // Sumar estadísticas
        mapsData[map_number].teams[team_id].kills += kills;
        mapsData[map_number].teams[team_id].gold += gold;

        // Solo asignar duración y ganador una vez
        mapsData[map_number].duration = formatDuration(duration);
        mapsData[map_number].winnerId = winner_id;
    });

    console.dir(mapsData, { depth: null });

    return mapsData;
}

export async function lolMapStats(fixture_id) {
    const mapResultsLol = await getMapResultsLol(fixture_id);
    const pickBanLol = await getPickBanLol(fixture_id);

    const result = renderMapResultsLOL(pickBanLol, mapResultsLol);
    return result;
}

// Ejecutar para probar
lolMapStats()

