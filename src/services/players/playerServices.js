// src/services/players/playerServices.js

import { getDbBySport } from '../../utils/dbUtils.js';

// Return paginated players with optional filters
export const findAll = async ({ page = 1, filters = {}, sport = 'cs2' } = {}) => {
  const db = getDbBySport(sport);
  const itemsPerPage = 50;
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const offset = (safePage - 1) * itemsPerPage;

  const conditions = [];
  const params = [];

  if (filters.id !== undefined && filters.id !== '') {
    conditions.push('id = ?');
    params.push(filters.id);
  }

  if (filters.team_id !== undefined && filters.team_id !== '') {
    conditions.push('team_id = ?');
    params.push(filters.team_id);
  }

  if (filters.first_name) {
    conditions.push('`first_name` LIKE ?');
    params.push(`%${filters.first_name}%`);
  }

  if (filters.last_name) {
    conditions.push('`last_name` LIKE ?');
    params.push(`%${filters.last_name}%`);
  }

  if (filters.nickname) {
    conditions.push('`nickname` LIKE ?');
    params.push(`%${filters.nickname}%`);
  }

  if (filters.age !== undefined && filters.age !== '') {
    conditions.push('age = ?');
    params.push(filters.age);
  }

  // Always filter by sport
  if (sport) {
    conditions.push('sport = ?');
    params.push(sport);
  }

  const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) as total FROM player${whereClause}`;
  const [[{ total }]] = await db.execute(countQuery, params);

  const dataQuery = `SELECT * FROM player${whereClause} ORDER BY id DESC LIMIT ${itemsPerPage} OFFSET ${offset}`;
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

export const findById = async (id, sport = 'cs2') => {
  const db = getDbBySport(sport);
  const [rows] = await db.execute('SELECT * FROM player WHERE id = ? AND sport = ? LIMIT 1', [id, sport]);
  return rows && rows.length ? rows[0] : null;
};
