// src/controllers/teams/teamControllers.js

import { findAll, findById } from '../../services/teams/teamServices.js';

export const listTeams = async (req, res) => {
  try {
    const { page } = req.query || {};
    const filters = {
      id: req.query.id,
      name: req.query.name,
    };

    // sport comes from per-game route via req.params.sport or ?sport=...
    const sport = req.params && req.params.sport ? req.params.sport : req.query.sport || 'cs2';

    const parsedPage = Number.isFinite(Number(page)) ? parseInt(page, 10) : 1;

    const result = await findAll({ page: parsedPage, filters, sport });
    res.json(result);
  } catch (err) {
    console.error('Error in listTeams:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const sport = req.params && req.params.sport ? req.params.sport : req.query.sport || 'cs2';
    const row = await findById(id, sport);
    if (!row) return res.status(404).json({ error: 'Team not found' });
    res.json(row);
  } catch (err) {
    console.error('Error in getTeamById:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Per-game handlers
export const getTeamsCS2 = (req, res) => { req.params.sport = 'cs2'; return listTeams(req, res); };
export const getTeamByIdCS2 = (req, res) => { req.params.sport = 'cs2'; return getTeamById(req, res); };

export const getTeamsLOL = (req, res) => { req.params.sport = 'lol'; return listTeams(req, res); };
export const getTeamByIdLOL = (req, res) => { req.params.sport = 'lol'; return getTeamById(req, res); };

export const getTeamsDOTA2 = (req, res) => { req.params.sport = 'dota2'; return listTeams(req, res); };
export const getTeamByIdDOTA2 = (req, res) => { req.params.sport = 'dota2'; return getTeamById(req, res); };
