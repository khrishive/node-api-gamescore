import express from 'express';
import { getFixtureMaps } from '../controllers/fixtureMapsController.js';

const router = express.Router();

router.get('/:fixtureId/maps', async (req, res) => {
  try {
    const fixtureId = req.params.fixtureId;
    const data = await getFixtureMaps(fixtureId);
    if (!data || !data.maps.length) return res.status(404).json({ error: 'No maps found for this fixture' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;