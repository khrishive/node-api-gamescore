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

  const { today, from, to, ...filters } = req.query;

  if (today === 'true') {
    const now = new Date();
    const start_day = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const end_day = start_day + (24 * 60 * 60 * 1000) - 1;
    filters.todayRange = { start_day, end_day };
    console.log('Filtro today=true:', {
      start_day,
      end_day,
      startISO: new Date(start_day).toISOString(),
      endISO: new Date(end_day).toISOString()
    });
  } else if (from && to) {
    try {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (isNaN(fromDate) || isNaN(toDate)) {
        return res.status(400).json({ error: 'Formato de fecha inválido. Usa YYYY-MM-DD' });
      }

      const fromMs = Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate());
      const toMs = Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate()) + (24 * 60 * 60 * 1000) - 1;

      console.log('🎯 Filtro por rango :v:', {
        from: new Date(fromMs).toISOString(),
        to: new Date(toMs).toISOString()
      });


      filters.customRange = { from: fromMs, to: toMs };
      console.log('🎯 Filtro por rango:', filters.customRange);
    } catch (err) {
      return res.status(400).json({ error: 'Error al convertir fechas' });
    }
  }

  try {
    console.log('📥 Filtros recibidos:', filters);
    const data = await getFixtures(offset, limit, filters);
    res.json(data);
  } catch (error) {
    console.error('Error en la conexión:', error);
    res.status(500).json({ error: 'Error de servidor' });
  }
});


router.get('/all_fixture', async (req, res) => {
    try {
        const data = await getAllRecords('fixtures');
        res.json(data);
    } catch (error) {
        console.error('Error en la conexión:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

router.get('/team_fixture_stats', async (req, res) => {
    try {
        const data = await getRecords('team_fixture_stats');
        res.json(data);
    } catch (error) {
        console.error('Error en la conexión:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

router.get('/fixture_links', async (req, res) => {
    try {
        const data = await getRecords('fixture_links');
        res.json(data);
    } catch (error) {
        console.error('Error en la conexión:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

router.get('/participants', async (req, res) => {
  try {
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

    const data = await getRecords('participants', offset, limit, filters, 'id DESC');
    res.json(data);
  } catch (error) {
    console.error('❌ Error en la conexión:', error.message);
    res.status(500).json({ error: 'Error de servidor' });
  }
});



router.get('/players', async (req, res) => {
  try {
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

    const data = await getRecords('player', offset, limit, filters, 'id DESC');
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
