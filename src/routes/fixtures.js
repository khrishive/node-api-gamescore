import express from 'express';
import { fetchFromApi } from '../controllers/apiController.js';

const router = express.Router();

// Obtener la lista de competiciones
router.get('/', async (req, res) => {
    console.log("🔍 Petición recibida en /fixtures con query:", req.query);
    const data = await fetchFromApi('fixtures', req.query);
    console.log("📩 Respuesta de la API en /fixtures:", data);
    res.json(data);
});

// Obtener detalles de una competición por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    console.log("🔍 Petición recibida en /fixtures/:id con ID:", id);
    const data = await fetchFromApi(`fixtures/${id}`);
    console.log("📩 Respuesta de la API en /fixtures/:id:", data);
    res.json(data);
});

// Obtener participantes de una competición
router.get('/:id/participants', async (req, res) => {
    const { id } = req.params;
    console.log("🔍 Petición recibida en /fixtures/:id/participants con ID:", id);
    const data = await fetchFromApi(`fixtures/${id}/participants`);
    console.log("📩 Respuesta de la API en /fixtures/:id/participants:", data);
    res.json(data);
});

// Obtener stages de una competición
router.get('/:id/stages', async (req, res) => {
    const { id } = req.params;
    console.log("🔍 Petición recibida en /fixtures/:id/stages con ID:", id);
    const data = await fetchFromApi(`fixtures/${id}/stages`);
    console.log("📩 Respuesta de la API en /fixtures/:id/stages:", data);
    res.json(data);
});

// Obtener participantes de un stage
router.get('/stage/:id/participants', async (req, res) => {
    const { id } = req.params;
    console.log("🔍 Petición recibida en /fixtures/stage/:id/participants con ID:", id);
    const data = await fetchFromApi(`fixtures/stage/${id}/participants`);
    console.log("📩 Respuesta de la API en /fixtures/stage/:id/participants:", data);
    res.json(data);
});

// Obtener fixtures de un stage
router.get('/stage/:id/stagefixtures', async (req, res) => {
    const { id } = req.params;
    console.log("🔍 Petición recibida en /fixtures/stage/:id/stagefixtures con ID:", id);
    const data = await fetchFromApi(`fixtures/stage/${id}/stagefixtures`);
    console.log("📩 Respuesta de la API en /fixtures/stage/:id/stagefixtures:", data);
    res.json(data);
});

// Obtener la lista de fixtures
router.get('/fixtures', async (req, res) => {
    console.log("🔍 Petición recibida en /fixtures con query:", req.query);
    const data = await fetchFromApi('fixtures', req.query);
    console.log("📩 Respuesta de la API en /fixtures:", data);
    res.json(data);
});

// Obtener detalles de un fixture por ID
router.get('/fixtures/:id', async (req, res) => {
    const { id } = req.params;
    console.log("🔍 Petición recibida en /fixtures/:id con ID:", id);
    const data = await fetchFromApi(`fixtures/${id}`);
    console.log("📩 Respuesta de la API en /fixtures/:id:", data);
    res.json(data);
});

// Obtener fixtures por competencia
router.get('/fixtures/:competitionId/fixtures', async (req, res) => {
    const { competitionId } = req.params;
    console.log("🔍 Petición recibida en /fixtures/:competitionId/fixtures con ID:", competitionId);
    const data = await fetchFromApi(`fixtures/${competitionId}/fixtures`, req.query);
    console.log("📩 Respuesta de la API en /fixtures/:competitionId/fixtures:", data);
    res.json(data);
});

export default router;