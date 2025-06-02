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
  // Lee offset y limit de la query string, con valores por defecto
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 100;
  
  // Extrae filtros (excepto offset y limit)
  const { offset: _offset, limit: _limit, ...filters } = req.query;

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
