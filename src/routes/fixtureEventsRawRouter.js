import express from 'express';
import { getFixtureEventsRaw } from '../controllers/fixtureEventsRawController.js';

const router = express.Router();

router.get('/:fixtureId/events-raw', async (req, res) => {
  try {
    const fixtureId = req.params.fixtureId;
    const data = await getFixtureEventsRaw(fixtureId);
    if (!data) return res.status(404).json({ error: 'No events found for this fixture' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;