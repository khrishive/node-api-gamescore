// controllers/matchEventController.js

import { dbCS2, dbLOL } from '../db.js';
import { getMatchMapResults } from '../services/getMatchMapResults.js';

const allowedFields = [
  'id', 'fixture_id', 'snapshot_number', 'sort_index', 'event_type', 'name',
  'map_name', 'map_number', 'half_number', 'round_number', 'event_timestamp',
  'actor_id', 'actor_name', 'actor_team_id', 'actor_side',
  'victim_id', 'victim_name', 'victim_team_id', 'victim_side',
  'weapon', 'kill_id', 'headshot', 'penetrated', 'no_scope',
  'through_smoke', 'while_blinded', 'winner_team_id'
];

// Helper to get the correct DB pool based on sport
function getDbBySport(sport = 'cs2') {
  if (sport === 'lol') return dbLOL;
  return dbCS2;
}

// GET /api/events
export const getMatchEvents = async (req, res) => {
  try {
    const filters = [];
    const values = [];
    const sport = req.query.sport || 'cs2';
    const db = getDbBySport(sport);

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

// GET /api/mapscores/:fixtureId
export const getMatchMapScores = async (req, res) => {
  const { fixtureId } = req.params;
  const sport = req.query.sport || 'cs2';

  if (!fixtureId || isNaN(fixtureId)) {
    return res.status(400).json({ error: 'Invalid or missing fixtureId parameter' });
  }

  try {
    const result = await getMatchMapResults(Number(fixtureId), sport);
    res.json(result);
  } catch (error) {
    console.error('❌ Error fetching map scores:', error.message);
    res.status(500).json({ error: 'Error fetching map scores' });
  }
};