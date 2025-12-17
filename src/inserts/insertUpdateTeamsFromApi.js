import axios from 'axios';
import dotenv from 'dotenv';
import { dbCS2, dbLOL } from '../db.js';

dotenv.config();

const API_URL = `${process.env.GAME_SCORE_API}/teams`;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

/**
 * Obtiene los datos del equipo desde la API
 */
async function fetchTeamFromAPI(id) {
    try {
        const response = await axios.get(`${API_URL}/${id}`, {
            headers: {
                Authorization: AUTH_TOKEN,
            },
            timeout: 15000,
        });

        return response.data || null;
    } catch (error) {
        console.error(`❌ API error for team ${id}: ${error.message}`);
        return null;
    }
}

/**
 * Normaliza lineup de la API a estructura DB
 */
function normalizeLineup(lineup = []) {
    const normalized = {};

    for (let i = 0; i < 5; i++) {
        normalized[`player_id_${i}`] = lineup[i]?.id?.toString() || null;
        normalized[`player_name_${i}`] = lineup[i]?.name || null;
    }

    return normalized;
}

/**
 * Compara valores actuales vs nuevos y devuelve solo los campos que cambiaron
 */
function diffFields(current, incoming) {
    const changes = {};

    for (const key of Object.keys(incoming)) {
        const curr = current[key] ?? null;
        const next = incoming[key] ?? null;

        if (!Object.is(curr, next)) {
            changes[key] = next;
        }
    }

    return changes;
}

/**
 * Sincroniza participants para una DB específica
 */
async function syncParticipantsForDB(db, sportName) {
    console.log(`\n🔄 Sincronizando participants (${sportName})`);

    const [participants] = await db.query(`
        SELECT
            id,
            player_id_0, player_name_0,
            player_id_1, player_name_1,
            player_id_2, player_name_2,
            player_id_3, player_name_3,
            player_id_4, player_name_4
        FROM participants
    `);

    for (const participant of participants) {
        const apiTeam = await fetchTeamFromAPI(participant.id);

        if (!apiTeam || !Array.isArray(apiTeam.most_recent_lineup)) {
            continue;
        }

        const apiPlayers = normalizeLineup(apiTeam.most_recent_lineup);

        const changes = diffFields(participant, apiPlayers);

        if (Object.keys(changes).length === 0) {
            continue; // ✅ Todo igual
        }

        const fields = Object.keys(changes)
            .map((f) => `${f} = ?`)
            .join(', ');

        const values = [...Object.values(changes), participant.id];

        await db.query(
            `UPDATE participants SET ${fields} WHERE id = ?`,
            values
        );

        console.log(
            `📝 Updated team ${participant.id} (${sportName}):`,
            Object.keys(changes)
        );
    }
}

/**
 * Ejecuta la sincronización completa
 */
export async function syncAllParticipants() {
    await syncParticipantsForDB(dbCS2, 'cs2');
    await syncParticipantsForDB(dbLOL, 'lol');

    console.log('\n✅ Sincronización de participants finalizada');
}
