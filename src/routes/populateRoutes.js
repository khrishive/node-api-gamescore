import express from 'express';
import { Worker } from 'worker_threads';
import path from 'path';

const router = express.Router();

const createWorker = (res, scriptPath, sport) => {
    const worker = new Worker(path.resolve(scriptPath), {
        workerData: { sport },
    });

    worker.on('message', (msg) => {
        res.json({ message: msg, sport });
    });

    worker.on('error', (err) => {
        console.error('❌ Worker error:', err);
        res.status(500).json({ error: err.message });
    });

    worker.on('exit', (code) => {
        if (code !== 0) {
            console.error(`❌ Worker stopped with code ${code}`);
        }
    });
};

router.post('/general', (req, res) => {
    const sport = req.body.sport || req.query.sport;
    if (!sport || sport.trim() === '') {
        return res.status(400).json({ error: 'Sport is required and cannot be empty.' });
    }
    createWorker(res, "src/inserts/populateDataInDB.js", sport);
});

router.post('/create-tables', (req, res) => {
    const sport = req.body.sport || req.query.sport;
    if (!sport || sport.trim() === '') {
        return res.status(400).json({ error: 'Sport is required and cannot be empty.' });
    }
    createWorker(res, "src/inserts/createTables.js", sport);
});

router.post('/insert-competitions', (req, res) => {
    const sport = req.body.sport || req.query.sport;
    if (!sport || sport.trim() === '') {
        return res.status(400).json({ error: 'Sport is required and cannot be empty.' });
    }
    createWorker(res, "src/inserts/insertCompetitions.js", sport);
});

router.post('/insert-fixtures', (req, res) => {
    const sport = req.body.sport || req.query.sport;
    if (!sport || sport.trim() === '') {
        return res.status(400).json({ error: 'Sport is required and cannot be empty.' });
    }
    createWorker(res, "src/inserts/insertOnlyFixtures.js", sport);
});

router.post('/insert-teams', (req, res) => {
    const sport = req.body.sport || req.query.sport;
    if (!sport || sport.trim() === '') {
        return res.status(400).json({ error: 'Sport is required and cannot be empty.' });
    }
    createWorker(res, "src/inserts/insertTeams.js", sport);
});

router.post('/insert-teams-players', (req, res) => {
    const sport = req.body.sport || req.query.sport;
    if (!sport || sport.trim() === '') {
        return res.status(400).json({ error: 'Sport is required and cannot be empty.' });
    }
    createWorker(res, "src/inserts/insertTeamsAndPlayers.js", sport);
});

router.post('/update-participants', (req, res) => {
    const sport = req.body.sport || req.query.sport;
    if (!sport || sport.trim() === '') {
        return res.status(400).json({ error: 'Sport is required and cannot be empty.' });
    }
    createWorker(res, "src/inserts/updateNumberOfParticipantsInCompetitions.js", sport);
});

router.post('/update-descriptions', (req, res) => {
    const sport = req.body.sport || req.query.sport;
    if (!sport || sport.trim() === '') {
        return res.status(400).json({ error: 'Sport is required and cannot be empty.' });
    }
    createWorker(res, "src/inserts/insertCompetitionDescriptionsGeneralAI.js", sport);
});

export default router;
