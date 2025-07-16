import express from 'express';
import { mapBreakdownController } from '../controllers/mapBreakdownController.js';

const router = express.Router();

router.get('/team/:teamId/map-breakdown', mapBreakdownController);

export default router;
