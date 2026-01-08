import { getDbBySport } from '../../utils/dbUtils.js';

// Helper function to build WHERE clause conditions
const buildConditions = (filters, sport) => {
  const params = [];
  const conditions = [];

  // Date filtering: from/to or customRange or start_date/end_date
  if (filters.from && filters.to) {
    const fromTimestamp = new Date(`${filters.from}T00:00:00Z`).getTime();
    const toTimestamp = new Date(`${filters.to}T23:59:59Z`).getTime();
    conditions.push(`start_date BETWEEN ? AND ?`);
    params.push(fromTimestamp, toTimestamp);
  } else if (filters.customRange) {
    const { from, to } = filters.customRange;
    if (from && to) {
      const fromTimestamp = new Date(from).getTime();
      const toTimestamp = new Date(`${to}T23:59:59Z`).getTime();
      conditions.push(`start_date BETWEEN ? AND ?`);
      params.push(fromTimestamp, toTimestamp);
    }
  } else if (filters.start_date && filters.end_date) {
    const fromTimestamp = new Date(filters.start_date).getTime();
    const toTimestamp = new Date(`${filters.end_date}T23:59:59Z`).getTime();
    conditions.push(`start_date BETWEEN ? AND ?`);
    params.push(fromTimestamp, toTimestamp);
  } else if (filters.start_date) {
    const fromTimestamp = new Date(filters.start_date).getTime();
    conditions.push(`start_date >= ?`);
    params.push(fromTimestamp);
  } else if (filters.end_date) {
    const toTimestamp = new Date(`${filters.end_date}T23:59:59Z`).getTime();
    conditions.push(`start_date <= ?`);
    params.push(toTimestamp);
  }

  // Allow filtering by id explicitly
  if (filters.id !== undefined && filters.id !== '') {
    conditions.push('id = ?');
    params.push(filters.id);
  }

  // Name filter (partial match)
  if (filters.name) {
    conditions.push('`name` LIKE ?');
    params.push(`%${filters.name}%`);
  }

  // Status filter (exact match)
  if (filters.status !== undefined && filters.status !== '') {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  // Additional optional numeric/text fields
  const filterFields = [
    'prize_pool_usd', 'location', 'organizer', 'type', 'fixture_count', 'description',
    'no_participants', 'stage', 'time_of_year', 'year', 'series', 'tier'
  ];

  for (const field of filterFields) {
    if (filters[field] !== undefined) {
      if (field === 'description' || field === 'location' || field === 'organizer' || field === 'series') {
        conditions.push(`\`${field}\` LIKE ?`);
        params.push(`%${filters[field]}%`);
      } else {
        conditions.push(`\`${field}\` = ?`);
        params.push(filters[field]);
      }
    }
  }

  // Always filter by sport_alias using sport value
  if (sport) {
    conditions.push('sport_alias = ?');
    params.push(sport);
  }

  return { conditions, params };
};

// Service to query competitions table with flexible filters and pagination
export const findAll = async ({ page = 1, filters = {}, sport = 'cs2' } = {}) => {
  const db = getDbBySport(sport);
  const itemsPerPage = 50;
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const offset = (safePage - 1) * itemsPerPage;

  const { conditions, params } = buildConditions(filters, sport);

  // Build WHERE clause
  let whereClause = '';
  if (conditions.length > 0) {
    whereClause = ` WHERE ` + conditions.join(' AND ');
  }

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM competitions${whereClause}`;
  const [[{ total }]] = await db.execute(countQuery, params);

  // Get paginated data
  const dataQuery = `SELECT * FROM competitions${whereClause} ORDER BY updated_at DESC LIMIT ${itemsPerPage} OFFSET ${offset}`;
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
  const query = `SELECT * FROM competitions WHERE id = ? AND sport_alias = ? LIMIT 1`;
  const [rows] = await db.execute(query, [id, sport]);
  return rows && rows.length ? rows[0] : null;
};
