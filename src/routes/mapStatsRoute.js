import express from 'express';
import { getMapStats, getMapStatsByMap, getMapRoundScores } from '../controllers/mapStatsController.js';

const router = express.Router();

// Ruta: /api/map-stats/:fixtureId
router.get('/map-stats/:fixtureId', getMapStats);

// One row per player per map, unaveraged (for ADR round-weighting downstream)
router.get('/map-stats-by-map/:fixtureId', getMapStatsByMap);

router.get('/map-round-scores/:fixtureId', getMapRoundScores);

export default router;
