import express from 'express';
import { spawn } from 'child_process';

const router = express.Router();

router.post('/general', async (req, res) => {
    const sport = req.body.sport || req.query.sport;

    if (!sport || sport.trim() === '') {
        return res.status(400).json({ error: 'Sport is required and cannot be empty.' });
    }

    // Spawn a new process to run the script
    const child = spawn('node', ['src/inserts/populateDataInDB.js', sport], {
        stdio: 'inherit', // or ['ignore', 'pipe', 'pipe'] if you want to capture output
        shell: process.platform === 'win32' // for Windows compatibility
    });

    child.on('error', (err) => {
        console.error('❌ Error al ejecutar el script:', err);
        res.status(500).json({ error: err.message });
    });

    child.on('exit', (code) => {
        if (code === 0) {
            res.json({ message: '✅ Script ejecutado correctamente.', sport });
        } else {
            res.status(500).json({ error: `Script exited with code ${code}` });
        }
    });
});

export default router;