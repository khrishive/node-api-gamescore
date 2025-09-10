import { dbCS2, dbLOL } from '../db.js'; // Use your updated db.js
import mysql from 'mysql2/promise';

// Helper to get the correct DB pool based on sport
function getDbPoolBySport(sport = 'cs2') {
  if (sport === 'lol') return dbLOL;
  return dbCS2; // default to cs2
}

export const getCompetitions = async (offset = 0, limit = 100, filters = {}, sport = 'cs2') => {
  const db = getDbPoolBySport(sport);
  let query = `SELECT * FROM competitions`;
  const params = [];
  const conditions = [];

  if (filters.customRange) {
    const { from, to } = filters.customRange;
    conditions.push(`start_date BETWEEN ? AND ?`);
    params.push(from, to);
  }

  if (filters.id) {
    conditions.push(`id = ?`);
    params.push(filters.id);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY updated_at DESC`;

  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 100;
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;

  query += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;

  const [rows] = await db.execute(query, params);
  return rows;
};
