import express from 'express';
import { lolMapStats } from '../controllers/controllerMapResultsLol.js';
import { lolPickBan } from '../controllers/controllerPickBanLol.js';
import {mainPlayerBuild} from '../controllers/controllerPlayerBuildLol.js';

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

router.get('/:fixtureId/build/:team1/:team2', async (req, res) => {
  try {
    const { fixtureId, team1, team2 } = req.params;

    // 🔹 Convertir a número (los params llegan como strings)
    const fixtureIdNum = parseInt(fixtureId);
    const team1Id = parseInt(team1);
    const team2Id = parseInt(team2);
    
    if (isNaN(fixtureIdNum) || isNaN(team1Id) || isNaN(team2Id)) {
      return res.status(400).json({ error: 'fixtureId, team1 y team2 deben ser números válidos' });
    }

    console.log(`⚙️ Generando build data → Fixture: ${fixtureIdNum}, Teams: ${team1Id} vs ${team2Id}`);

    const data = await mainPlayerBuild(fixtureIdNum, team1Id, team2Id);

    if (!data || !data.length) {
      return res.status(404).json({ error: 'No data found for this fixture' });
    }

    res.json({
      fixture_id: fixtureIdNum,
      team1_id: team1Id,
      team2_id: team2Id,
      maps: data,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;