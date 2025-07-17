// routes/matchEventRoute.js

import express from 'express';
import { 
  getMatchEvents,
  getMatchMapScores
} from '../controllers/matchEventController.js';

const router = express.Router();

// Ruta principal para obtener eventos con filtros
router.get('/events', getMatchEvents);

// Nueva ruta para obtener scores por mapa
router.get('/mapscores/:fixtureId', getMatchMapScores);

export default router;
