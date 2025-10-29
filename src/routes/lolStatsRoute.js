import express from 'express';
import { lolMapStats } from '../controllers/controllerMapResultsLol.js';
import { lolPickBan } from '../controllers/controllerPickBanLol.js';

const router = express.Router();

router.get('/:fixtureId/mapStats', async (req, res) => {
  try {
    const fixtureId = req.params.fixtureId;
    const data = await lolMapStats(fixtureId);
    if (!data) return res.status(404).json({ error: 'Fixture not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:fixtureId/pickBan', async (req, res) => {
  try {
    const fixtureId = req.params.fixtureId;
    const data = await lolPickBan(fixtureId);
    if (!data) return res.status(404).json({ error: 'Fixture not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;