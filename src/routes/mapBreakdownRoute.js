import express from 'express';
import { mapBreakdownController } from '../controllers/mapBreakdownController.js';
import { mapBreakdownControllerNoTournament } from '../controllers/mapBreakdownController.js';

const router = express.Router();

router.get('/team/:teamId/:competitionId/map-breakdown', mapBreakdownController);

router.get('/team/:teamId/map-breakdown', mapBreakdownControllerNoTournament);


export default router;
