import express from 'express';
import { Worker } from 'worker_threads';
import path from 'path';

const router = express.Router();

router.post('/general', (req, res) => {
    const sport = req.body.sport || req.query.sport;

    if (!sport || sport.trim() === '') {
        return res.status(400).json({ error: 'Sport is required and cannot be empty.' });
    }

    const worker = new Worker(path.resolve("src/inserts/populateDataInDB.js"), {
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
});

export default router;
