// src/controllers/players/playerControllers.js

import { findAll, findById } from '../../services/players/playerServices.js';

export const listPlayers = async (req, res) => {
  try {
    const { page } = req.query || {};
    const filters = {
      id: req.query.id,
      team_id: req.query.team_id,
      first_name: req.query.first_name,
      last_name: req.query.last_name,
      nickname: req.query.nickname,
      age: req.query.age,
    };

    // sport comes from per-game route via req.params.sport or ?sport=...
    const sport = req.params && req.params.sport ? req.params.sport : req.query.sport || 'cs2';

    const parsedPage = Number.isFinite(Number(page)) ? parseInt(page, 10) : 1;

    const result = await findAll({ page: parsedPage, filters, sport });
    res.json(result);
  } catch (err) {
    console.error('Error in listPlayers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPlayerById = async (req, res) => {
  try {
    const { id } = req.params;
    const sport = req.params && req.params.sport ? req.params.sport : req.query.sport || 'cs2';
    const row = await findById(id, sport);
    if (!row) return res.status(404).json({ error: 'Player not found' });
    res.json(row);
  } catch (err) {
    console.error('Error in getPlayerById:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Per-game handlers
export const getPlayersCS2 = (req, res) => { req.params.sport = 'cs2'; return listPlayers(req, res); };
export const getPlayerByIdCS2 = (req, res) => { req.params.sport = 'cs2'; return getPlayerById(req, res); };

export const getPlayersLOL = (req, res) => { req.params.sport = 'lol'; return listPlayers(req, res); };
export const getPlayerByIdLOL = (req, res) => { req.params.sport = 'lol'; return getPlayerById(req, res); };

export const getPlayersDOTA2 = (req, res) => { req.params.sport = 'dota2'; return listPlayers(req, res); };
export const getPlayerByIdDOTA2 = (req, res) => { req.params.sport = 'dota2'; return getPlayerById(req, res); };
