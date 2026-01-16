//src/routes/players.js
import express from 'express';
import {
  getPlayersCS2,
  getPlayerByIdCS2,
  getPlayersLOL,
  getPlayerByIdLOL,
  getPlayersDOTA2,
  getPlayerByIdDOTA2
} from '../controllers/players/playerControllers.js';

const router = express.Router();

// Per-game routes for players (support query filters: id, team_id, first_name, last_name, nickname, age and ?page)
router.get('/cs2', getPlayersCS2);
router.get('/cs2/:id', getPlayerByIdCS2);

router.get('/lol', getPlayersLOL);
router.get('/lol/:id', getPlayerByIdLOL);

router.get('/dota2', getPlayersDOTA2);
router.get('/dota2/:id', getPlayerByIdDOTA2);

export default router;