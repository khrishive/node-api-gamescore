import express from 'express';
import { getMapStats } from '../controllers/mapStatsController.js';

const router = express.Router();

// Ruta: /api/map-stats/:fixtureId
router.get('/map-stats/:fixtureId', getMapStats);

export default router;
