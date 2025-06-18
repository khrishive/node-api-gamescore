import express from 'express';
import { getFixtureEquipmentState } from '../controllers/fixtureEquipmentStateController.js';

const router = express.Router();

router.get('/:fixtureId/equipment', async (req, res) => {
  try {
    const fixtureId = req.params.fixtureId;
    const data = await getFixtureEquipmentState(fixtureId);
    if (!data) return res.status(404).json({ error: 'Fixture not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;