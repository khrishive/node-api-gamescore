import { getDbBySport } from '../utils/dbUtils.js';

export const getCompetitions = async (offset = 0, limit = 100, filters = {}, sport = 'cs2') => {
  const db = getDbBySport(sport);
  let query = `SELECT * FROM competitions`;
  const params = [];
  const conditions = [];

  // Filter by id
  if (filters.id !== undefined && filters.id !== '') {
    conditions.push('id = ?');
    params.push(filters.id);
  }

  // Filter by name (partial match)
  if (filters.name) {
    conditions.push('`name` LIKE ?');
    params.push(`%${filters.name}%`);
  }

  // Filter by status
  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  // Filter by start_date (supports date range yyyy-mm-dd or timestamps)
  if (filters.start_date_from && filters.start_date_to) {
    conditions.push('start_date BETWEEN ? AND ?');
    params.push(filters.start_date_from, filters.start_date_to);
  } else if (filters.start_date) {
    // If just one value, treat as >= comparison
    conditions.push('start_date >= ?');
    params.push(filters.start_date);
  }

  // Always filter by sport_alias
  if (sport) {
    conditions.push('sport_alias = ?');
    params.push(sport);
  }

  const whereClause = conditions.length > 0 ? ` WHERE ` + conditions.join(' AND ') : '';

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM competitions${whereClause}`;
  const [[{ total }]] = await db.execute(countQuery, params);

  // Special case: limit = -1 means fetch all without pagination
  if (limit === -1) {
    const dataQuery = query + whereClause + ` ORDER BY updated_at DESC`;
    const [rows] = await db.execute(dataQuery, params);
    return {
      data: rows,
      pagination: {
        offset: 0,
        limit: -1,
        totalItems: total,
        totalPages: 1,
        currentPage: 1
      }
    };
  }

  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 100;
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;

  // Get paginated data
  const dataQuery = query + whereClause + ` ORDER BY updated_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
  const [rows] = await db.execute(dataQuery, params);

  const totalPages = Math.ceil(total / safeLimit);

  return {
    data: rows,
    pagination: {
      offset: safeOffset,
      limit: safeLimit,
      totalItems: total,
      totalPages,
      currentPage: Math.floor(safeOffset / safeLimit) + 1
    }
  };
};
