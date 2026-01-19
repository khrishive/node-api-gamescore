//src/controllers/controllerMapResultsDota2.js

import { getMapResultsDota2, getPickBanDota2 } from './dota2Controllers.js';

function renderMapResultsDota2(dota2PickBanData, dota2FixtureData) {
    if (!dota2PickBanData || !dota2FixtureData) {
        console.log('No data available');
        return;
    }

    const mapsData = {};

    // 🔹 1. Procesar picks
    dota2PickBanData
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

    // 🔹 2. Procesar resultados del mapa (cada fila es un jugador individual)
    dota2FixtureData.forEach(row => {
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

        // Crear el equipo si no existe (mantener picks del paso anterior)
        if (!mapsData[map_number].teams[team_id]) {
            mapsData[map_number].teams[team_id] = { picks: [], kills: 0, gold: 0 };
        }

        // Sumar estadísticas individuales de cada jugador
        mapsData[map_number].teams[team_id].kills += kills;
        mapsData[map_number].teams[team_id].gold += gold;

        // Asignar duración y ganador (se sobrescribe, pero es el mismo valor para todos)
        mapsData[map_number].duration = formatDuration(duration);
        mapsData[map_number].winnerId = winner_id;
    });

    console.dir(mapsData, { depth: null });

    return mapsData;
}

export async function dota2MapStats(fixture_id) {
    const mapResultsDota2 = await getMapResultsDota2(fixture_id);
    const pickBanDota2 = await getPickBanDota2(fixture_id);

    const result = renderMapResultsDota2(pickBanDota2, mapResultsDota2);
    return result;
}

// Ejecutar para probar
//dota2MapStats(972603)

