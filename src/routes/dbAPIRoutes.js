import express from 'express';
const router = express.Router();
import {getRecords} from '../controllers/dbController.js';
import {getAllRecords} from '../controllers/dbController.js';


let dbController = getRecords()
// Endpoint para obtener todos los registros de la tabla 'competitions'
router.get('/competitions', async (req, res) => {
    try {
        const data = await dbController('competitions');
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

  const { today, ...filters } = req.query;

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
  }

  try {
    const data = await dbController('fixtures', offset, limit, filters);
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
        const data = await dbController('team_fixture_stats');
        res.json(data);
    } catch (error) {
        console.error('Error en la conexión:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

router.get('/fixture_links', async (req, res) => {
    try {
        const data = await dbController('fixture_links');
        res.json(data);
    } catch (error) {
        console.error('Error en la conexión:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

router.get('/participants', async (req, res) => {
    try {
        const data = await dbController('participants');
        res.json(data);
    } catch (error) {
        console.error('Error en la conexión:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

router.get('/player', async (req, res) => {
    try {
        const data = await dbController('player');
        res.json(data);
    } catch (error) {
        console.error('Error en la conexión:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

router.get('/stats_player', async (req, res) => {
    try {
        const data = await dbController('stats_player');
        res.json(data);
    } catch (error) {
        console.error('Error en la conexión:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

router.get('/team_info', async (req, res) => {
    try {
        const data = await dbController('team_info');
        res.json(data);
    } catch (error) {
        console.error('Error en la conexión:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

export default router;
