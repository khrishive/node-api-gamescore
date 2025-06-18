import express from 'express';
import { getFixtureStats } from '../controllers/fixtureStatsController.js';

const router = express.Router();

router.get('/:fixtureId/stats', async (req, res) => {
    try {
        const fixtureId = req.params.fixtureId;
        const mapId = req.query.map_id || null; // <-- soporta el filtro opcional
        const data = await getFixtureStats(fixtureId, mapId);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;