//src/routes/teams.js

import express from 'express';
import {
    getTeamsCS2,
    getTeamByIdCS2,
    getTeamsLOL,
    getTeamByIdLOL,
    getTeamsDOTA2,
    getTeamByIdDOTA2
} from '../controllers/teams/teamControllers.js';

const router = express.Router();

// Per-game routes for teams (support query filters: id, name and ?page)
router.get('/cs2', getTeamsCS2);
router.get('/cs2/:id', getTeamByIdCS2);

router.get('/lol', getTeamsLOL);
router.get('/lol/:id', getTeamByIdLOL);

router.get('/dota2', getTeamsDOTA2);
router.get('/dota2/:id', getTeamByIdDOTA2);

export default router;