// src/services/teamsService.js

import { dbCS2, dbLOL, dbDOTA2 } from '../db.js';

const DBS = {
    cs2: dbCS2,
    lol: dbLOL,
    dota2: dbDOTA2,
};

/**
 * Obtiene equipos desde una DB específica
 */
const getTeamsFromDb = async (db, sport) => {
    const [rows] = await db.query(
        `
        SELECT 
            id,
            name,
            sport,
            country,
            countryISO,
            region,
            image_url,
            hs_description,
            rr_description,
            manual_override,
            manual_updated_at
        FROM participants
        ${sport ? 'WHERE sport = ?' : ''}
        `,
        sport ? [sport] : []
    );

    return rows;
};

/**
 * Obtiene equipos de una o todas las DB
 */
export const getTeams = async ({ sport }) => {
    // Si el sport coincide con una DB específica
    if (sport && DBS[sport]) {
        return await getTeamsFromDb(DBS[sport], sport);
    }

    // Si no hay sport → traer de todas
    const results = await Promise.all([
        getTeamsFromDb(dbCS2),
        getTeamsFromDb(dbLOL),
        getTeamsFromDb(dbDOTA2),
    ]);

    // Unificamos todo en un solo array
    return results.flat();
};

/**
 * Obtener equipo por ID (busca en todas las DB)
 */
export const getTeamById = async (id) => {
    for (const db of Object.values(DBS)) {
        const [rows] = await db.query(
            `SELECT * FROM participants WHERE id = ? LIMIT 1`,
            [id]
        );

        if (rows.length) {
            return rows[0];
        }
    }

    return null;
};
