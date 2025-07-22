import express from 'express';
import { getFixturesByCompetition } from '../controllers/fixtureByCompetitionController.js';

const router = express.Router();

router.get('/:competitionId', getFixturesByCompetition);

export default router;
