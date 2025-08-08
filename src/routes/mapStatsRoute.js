import express from 'express';
import { getMapStats, getMapRoundScores } from '../controllers/mapStatsController.js';

const router = express.Router();

// Ruta: /api/map-stats/:fixtureId
router.get('/map-stats/:fixtureId', getMapStats);

router.get('/map-round-scores', getMapRoundScores);

export default router;
