import express from 'express';
const router = express.Router();
import {getRecords} from '../controllers/dbController.js';
import {getAllRecords} from '../controllers/dbController.js';
import { getFixtures } from '../controllers/fixturesController.js';
import { getCompetitions } from '../controllers/competitionsController.js';

// Endpoint para obtener todos los registros de la tabla 'competitions'
router.get('/competitions', async (req, res) => {
  try {
    const {
      from, to, id, name, sport_alias, start_date, end_date, prize_pool_usd,
      location, organizer, type, fixture_count, description, no_participants,
      stage, time_of_year, year, series, tier, offset = 0, limit = 100
    } = req.query;
    const sport = req.query.sport || 'cs2'; // Always present

    const filters = {};
    if (from && to) {
      filters.customRange = { from, to };
    }
    if (id) filters.id = parseInt(id, 10);
    if (name) filters.name = name;
    if (sport_alias) filters.sport_alias = sport_alias;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (prize_pool_usd) filters.prize_pool_usd = prize_pool_usd;
    if (location) filters.location = location;
    if (organizer) filters.organizer = organizer;
    if (type) filters.type = type;
    if (fixture_count) filters.fixture_count = fixture_count;
    if (description) filters.description = description;
    if (no_participants) filters.no_participants = no_participants;
    if (stage) filters.stage = stage;
    if (time_of_year) filters.time_of_year = time_of_year;
    if (year) filters.year = year;
    if (series) filters.series = series;
    if (tier) filters.tier = tier;

    // Pass sport and filters to the controller
    const data = await getCompetitions(
      parseInt(offset),
      parseInt(limit),
      filters,
      sport
    );
    res.json(data);
  } catch (error) {
    console.error('Error en la conexión:', error);
    res.status(500).json({ error: 'Error de servidor' });
  }
});



router.get('/fixtures', async (req, res) => { 
  let offset = parseInt(req.query.offset, 10);
  let limit = parseInt(req.query.limit, 10);

  if (isNaN(offset)) offset = 0;
  if (isNaN(limit)) limit = 100;

  const {
    today, from, to,
    id, competition_id, competition_name, end_time, format_name, format_value,
    scheduled_start_time, sport_alias, sport_name, start_time, status, tie, winner_id,
    participants0_id, participants0_name, participants0_score,
    participants1_name, participants1_id, participants1_score
  } = req.query;

  const sport = req.query.sport || 'cs2';

  const filters = {};

  // Flexible date filtering for scheduled_start_time and start_time
  if (from && to) {
    filters.customRange = { from, to };
  } else if (from) {
    filters.from = from;
  } else if (to) {
    filters.to = to;
  }

  if (id) filters.id = id;
  if (competition_id) filters.competition_id = competition_id;
  if (competition_name) filters.competition_name = competition_name;
  if (end_time) filters.end_time = end_time;
  if (format_name) filters.format_name = format_name;
  if (format_value) filters.format_value = format_value;
  if (scheduled_start_time) filters.scheduled_start_time = scheduled_start_time;
  if (sport_alias) filters.sport_alias = sport_alias;
  if (sport_name) filters.sport_name = sport_name;
  if (start_time) filters.start_time = start_time;
  if (status) filters.status = status;
  if (tie) filters.tie = tie;
  if (winner_id) filters.winner_id = winner_id;
  if (participants0_id) filters.participants0_id = participants0_id;
  if (participants0_name) filters.participants0_name = participants0_name;
  if (participants0_score) filters.participants0_score = participants0_score;
  if (participants1_name) filters.participants1_name = participants1_name;
  if (participants1_id) filters.participants1_id = participants1_id;
  if (participants1_score) filters.participants1_score = participants1_score;

  try {
    const data = await getFixtures(offset, limit, filters, sport);
    res.json(data);
  } catch (error) {
    console.error('Error en la conexión:', error);
    res.status(500).json({ error: 'Error de servidor' });
  }
});


router.get('/all_fixtures', async (req, res) => {
    const sport = req.query.sport || 'cs2'; // Always present, default to 'cs2'
    try {
        const data = await getAllRecords('fixtures', sport); // Pass sport to controller
        res.json(data);
    } catch (error) {
        console.error('Error en la conexión:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

// Example for team_fixture_stats
router.get('/team_fixture_stats', async (req, res) => {
  const sport = req.query.sport || "cs2";
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 100;
  const filters = {}; // Add any filter logic if needed

  try {
    const data = await getRecords("team_fixture_stats", offset, limit, filters, '', sport);
    res.json(data);
  } catch (error) {
    console.error("Error en la conexión:", error);
    res.status(500).json({ error: "Error de servidor" });
  }
});

router.get('/fixture_links', async (req, res) => {
    const sport = req.query.sport || 'cs2'; // Always present, default to 'cs2'
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 100;

    // Only apply filter for fixture_id if present
    const filters = {};
    if (req.query.fixture_id !== undefined) {
        filters.fixture_id = req.query.fixture_id;
    }

    try {
        const data = await getRecords('fixture_links', offset, limit, filters, '', sport); // Pass sport to controller
        res.json(data);
    } catch (error) {
        console.error('Error en la conexión:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

router.get('/participants', async (req, res) => {
  try {
    const sport = req.query.sport || 'cs2'; // Always present, default to 'cs2'
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 100;

    // Campos válidos para la tabla participants
    const filters = {};
    const validFields = [
      'id', 'name', 'sport', 'country', 'countryISO', 'region',
      'player_id_0', 'player_name_0',
      'player_id_1', 'player_name_1',
      'player_id_2', 'player_name_2',
      'player_id_3', 'player_name_3',
      'player_id_4', 'player_name_4'
    ];

    for (const field of validFields) {
      if (req.query[field] !== undefined) {
        filters[field] = req.query[field];
      }
    }

    const data = await getRecords('participants', offset, limit, filters, 'id DESC', sport); // <-- Pass sport here
    res.json(data);
  } catch (error) {
    console.error('❌ Error en la conexión:', error.message);
    res.status(500).json({ error: 'Error de servidor' });
  }
});



router.get('/players', async (req, res) => {
  try {
    const sport = req.query.sport || 'cs2'; // Always present, default to 'cs2'
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 100;

    // Mapear solo los campos válidos de la tabla
    const filters = {};
    const validFields = [
      'id', 'team_id', 'first_name', 'last_name', 
      'nickname', 'age', 'country', 'countryISO', 'sport'
    ];

    for (const field of validFields) {
      if (req.query[field] !== undefined) {
        filters[field] = req.query[field];
      }
    }

    const data = await getRecords('player', offset, limit, filters, 'id DESC', sport); // <-- Pass sport here
    res.json(data);
  } catch (error) {
    console.error('❌ Error en la conexión:', error.message);
    res.status(500).json({ error: 'Error de servidor' });
  }
});

router.get('/stats_player', async (req, res) => {
    try {
        const data = await getRecords('stats_player');
        res.json(data);
    } catch (error) {
        console.error('Error en la conexión:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

router.get('/team_info', async (req, res) => {
    try {
        const data = await getRecords('team_info');
        res.json(data);
    } catch (error) {
        console.error('Error en la conexión:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

export default router;
