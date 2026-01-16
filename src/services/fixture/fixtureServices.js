// src/services/fixture/fixtureServices.js

import { getDbBySport } from '../../utils/dbUtils.js';

const dateToDayRange = (yyyyMMdd) => {
    const start = new Date(yyyyMMdd);
    if (Number.isNaN(start.getTime())) return null;
    const startMs = start.setHours(0,0,0,0);
    const endMs = start.setHours(23,59,59,999);
    return { startMs, endMs };
};

export const getFixtures = async ({ page = 1, filters = {}, sport = 'cs2' } = {}) => {
    const db = getDbBySport(sport);
    const itemsPerPage = 50;
    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const offset = (safePage - 1) * itemsPerPage;
    const where = [];
    const params = [];

    if (filters.id) {
        where.push('id = ?');
        params.push(filters.id);
    }

    if (filters.competition_id) {
        where.push('competition_id = ?');
        params.push(filters.competition_id);
    }

    if (filters.status) {
        where.push('status = ?');
        params.push(filters.status);
    }

    // Date range filtering with from/to (uses COALESCE for fallback to scheduled_start_time)
    if (filters.from && filters.to) {
        const fromTimestamp = new Date(`${filters.from}T00:00:00Z`).getTime();
        const toTimestamp = new Date(`${filters.to}T23:59:59Z`).getTime();
        where.push('COALESCE(start_time, scheduled_start_time) BETWEEN ? AND ?');
        params.push(fromTimestamp, toTimestamp);
    }

    // Fecha en formato yyyy-mm-dd → filtrar por ese día (ms)
    if (filters.start_time) {
        const range = dateToDayRange(filters.start_time);
        if (range) {
            where.push('start_time BETWEEN ? AND ?');
            params.push(range.startMs, range.endMs);
        }
    }

    if (filters.end_time) {
        const range = dateToDayRange(filters.end_time);
        if (range) {
            where.push('end_time BETWEEN ? AND ?');
            params.push(range.startMs, range.endMs);
        }
    }

    if (filters.scheduled_start_time) {
        const range = dateToDayRange(filters.scheduled_start_time);
        if (range) {
            where.push('scheduled_start_time BETWEEN ? AND ?');
            params.push(range.startMs, range.endMs);
        }
    }

    // Always filter by sport_alias when sport provided
    if (sport) {
        where.push('sport_alias = ?');
        params.push(sport);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM fixtures ${whereClause}`;
    const [[{ total }]] = await db.execute(countQuery, params);

    const dataQuery = `SELECT * FROM fixtures ${whereClause} ORDER BY id DESC LIMIT ${itemsPerPage} OFFSET ${offset}`;
    const [rows] = await db.execute(dataQuery, params);

    const totalPages = Math.ceil(total / itemsPerPage);

    return {
        data: rows,
        pagination: {
            currentPage: safePage,
            itemsPerPage,
            totalItems: total,
            totalPages
        }
    };
};

export const getFixtureById = async (id, sport = null) => {
    if (sport) {
        const db = getDbBySport(sport);
        const [rows] = await db.execute(`SELECT * FROM fixtures WHERE id = ? AND sport_alias = ? LIMIT 1`, [id, sport]);
        return rows && rows.length ? rows[0] : null;
    }

    // Search across all DBs
    for (const s of ['cs2', 'lol', 'dota2']) {
        const db = getDbBySport(s);
        const [rows] = await db.execute(`SELECT * FROM fixtures WHERE id = ? AND sport_alias = ? LIMIT 1`, [id, s]);
        if (rows && rows.length) return rows[0];
    }

    return null;
};
