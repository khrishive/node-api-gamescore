// controllers/matchEventController.js

import { db } from '../db.js';

const allowedFields = [
  'id', 'fixture_id', 'snapshot_number', 'sort_index', 'event_type', 'name',
  'map_name', 'map_number', 'half_number', 'round_number', 'event_timestamp',
  'actor_id', 'actor_name', 'actor_team_id', 'actor_side',
  'victim_id', 'victim_name', 'victim_team_id', 'victim_side',
  'weapon', 'kill_id', 'headshot', 'penetrated', 'no_scope',
  'through_smoke', 'while_blinded', 'winner_team_id'
];

// GET /api/events
export const getMatchEvents = async (req, res) => {
  try {
    const filters = [];
    const values = [];

    for (const [key, value] of Object.entries(req.query)) {
      if (allowedFields.includes(key)) {
        filters.push(`${key} = ?`);
        values.push(value);
      }
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const sql = `SELECT * FROM cs_match_events ${whereClause} ORDER BY id LIMIT 5000`;

    const [rows] = await db.query(sql, values);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener los eventos:', err.message);
    res.status(500).json({ error: 'Error al obtener los eventos' });
  }
};
