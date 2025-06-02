import express from 'express';
const router = express.Router();
import dbController from '../controllers/dbController.js';

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
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 100;
  const { offset: _offset, limit: _limit, today, ...filters } = req.query;

  if (today === 'true') {
    const now = new Date();
    const startOfDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;
    filters.todayRange = { from: startOfDay, to: endOfDay };
    console.log('Filtro today=true OR en fechas:', {
      startOfDay, endOfDay,
      startISO: new Date(startOfDay).toISOString(),
      endISO: new Date(endOfDay).toISOString()
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
