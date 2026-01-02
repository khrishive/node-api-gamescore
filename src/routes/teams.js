import express from 'express';
import { fetchFromApi } from '../controllers/apiController.js';
import {
    getTeamsController,
    getTeamByIdController,
} from '../controllers/apiController.js';

const router = express.Router();



// GET /teams?sport=cs2|lol|dota2
router.get('/', getTeamsController);

// GET /teams/:id
router.get('/:id', getTeamByIdController);

export default router;