import { dbCS2, dbLOL } from '../db.js'; // <-- Update your db.js to export these

/**
 * Helper to get the correct DB connection based on sport
 */
function getDbBySport(sport = 'cs2') {
  if (sport === 'lol') return dbLOL;
  return dbCS2; // default to cs2
}

/**
 * Obtener registros con paginación, filtros y orden.
 */
export const getRecords = async (tableName, offset, limit, filters = {}, orderBy = '', sport = 'cs2') => {
  const db = getDbBySport(sport);

  let query = `SELECT * FROM \`${tableName}\``;
  let params = [];
  const conditions = [];

  // 🔍 Filtros dinámicos por campos
  for (const [field, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;

    if (Array.isArray(value)) {
      // Para valores múltiples → `IN`
      conditions.push(`\`${field}\` IN (${value.map(() => '?').join(',')})`);
      params.push(...value);
    } else if (typeof value === 'string' && value.includes('%')) {
      // Para búsquedas con LIKE → usar % en el query param
      conditions.push(`\`${field}\` LIKE ?`);
      params.push(value);
    } else {
      // Igualdad simple
      conditions.push(`\`${field}\` = ?`);
      params.push(value);
    }
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // Orden
  if (orderBy) {
    query += ` ORDER BY ${orderBy}`;
  } else if (tableName === 'competitions') {
    query += ' ORDER BY updated_at DESC';
  }

  // Paginación
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 100;
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;
  query += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;
  const [rows] = await db.execute(query, params);
  return rows;
};

/**
 * Obtener todos los registros de una tabla.
 */
export const getAllRecords = async (tableName, sport = 'cs2') => {
  console.log('Fetching all records from', tableName, 'for sport', sport);
  const db = getDbBySport(sport);
  const [rows] = await db.execute(`SELECT * FROM \`${tableName}\``);
  return rows;
};
