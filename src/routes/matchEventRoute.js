// routes/matchEventRoute.js

import express from 'express';
import { getMatchEvents } from '../controllers/matchEventController.js';

const router = express.Router();

// Ruta principal para obtener eventos con filtros
router.get('/events', getMatchEvents);

export default router;
