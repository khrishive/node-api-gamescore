import { getDbBySport } from '../utils/dbUtils.js';

export const getFixtures = async (offset = 0, limit = 100, filters = {}, sport = 'cs2') => {
  const db = getDbBySport(sport);
  let query = `SELECT * FROM fixtures`;
  const params = [];
  const conditions = [];

  // Flexible date filtering for start_time and end_time only
  if (filters.customRange) {
    const { from, to } = filters.customRange;
    if (from && to) {
        const fromTimestamp = new Date(from).getTime();
        const toTimestamp = new Date(`${to}T23:59:59Z`).getTime();
        conditions.push(`start_time BETWEEN ? AND ?`);
        params.push(fromTimestamp, toTimestamp);
    }
  } else if (filters.from && filters.to) {
    const fromTimestamp = new Date(filters.from).getTime();
    const toTimestamp = new Date(`${filters.to}T23:59:59Z`).getTime();
    conditions.push(`start_time BETWEEN ? AND ?`);
    params.push(fromTimestamp, toTimestamp);
  } else if (filters.from) {
    const fromTimestamp = new Date(filters.from).getTime();
    conditions.push(`start_time >= ?`);
    params.push(fromTimestamp);
  } else if (filters.to) {
    const toTimestamp = new Date(`${filters.to}T23:59:59Z`).getTime();
    conditions.push(`start_time <= ?`);
    params.push(toTimestamp);
  }

  // Direct filter for end_time if provided
  if (filters.end_time) {
    conditions.push('end_time <= ?');
    params.push(filters.end_time);
  }

  // Direct filter for scheduled_start_time if provided
  // Support either a single bound (`scheduled_start_time`) or a range
  if (filters.scheduled_start_time_from && filters.scheduled_start_time_to) {
    conditions.push('scheduled_start_time BETWEEN ? AND ?');
    params.push(filters.scheduled_start_time_from, filters.scheduled_start_time_to);
  } else if (filters.scheduled_start_time) {
    conditions.push('scheduled_start_time >= ?');
    params.push(filters.scheduled_start_time);
  }

  // All other optional filters
  const filterFields = [
    'id', 'competition_id', 'format_value',
    'sport_alias', 'sport_name', 'status', 'tie', 'winner_id',
    'participants0_id', 'participants0_score', 'participants0_name',
    'participants1_id', 'participants1_score', 'participants1_name'
  ];

  for (const field of filterFields) {
    if (filters[field] !== undefined) {
      conditions.push(`\`${field}\` = ?`);
      params.push(filters[field]);
    }
  }

  // LIKE for competition_name, format_name, sport_name, status, participants0_name, participants1_name
  const likeFields = [
    'competition_name',
    'format_name',
    'sport_name',
    'status',
    'participants0_name',
    'participants1_name'
  ];

  for (const field of likeFields) {
    if (filters[field]) {
      conditions.push(`\`${field}\` LIKE ?`);
      params.push(`%${filters[field]}%`);
    }
  }

  const whereClause = conditions.length > 0 ? ` WHERE ` + conditions.join(' AND ') : '';

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM fixtures${whereClause}`;
  const [[{ total }]] = await db.execute(countQuery, params);

  // Special case: limit = -1 means fetch all without pagination
  if (limit === -1) {
    const dataQuery = query + whereClause;
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
  const dataQuery = query + whereClause + ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;
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

