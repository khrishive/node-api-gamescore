import express from 'express';
import { getFixtureAssists } from '../controllers/fixtureAssistsController.js';

const router = express.Router();

router.get('/:fixtureId/assists', async (req, res) => {
  try {
    const fixtureId = req.params.fixtureId;
    const data = await getFixtureAssists(fixtureId);
    if (!data) return res.status(404).json({ error: 'Fixture not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;