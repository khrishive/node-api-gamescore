import express from 'express';
import { fetchFromApi } from '../controllers/apiController.js';

const router = express.Router();

// Obtener la lista de competiciones
router.get('/', async (req, res) => {
    console.log("🔍 Petición recibida en /competitions con query:", req.query);
    const data = await fetchFromApi('competitions', req.query);
    console.log("📩 Respuesta de la API en /competitions:", data);
    res.json(data);
});

// Obtener detalles de una competición por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    console.log("🔍 Petición recibida en /competitions/:id con ID:", id);
    const data = await fetchFromApi(`competitions/${id}`);
    console.log("📩 Respuesta de la API en /competitions/:id:", data);
    res.json(data);
});

// Obtener participantes de una competición
router.get('/:id/participants', async (req, res) => {
    const { id } = req.params;
    console.log("🔍 Petición recibida en /competitions/:id/participants con ID:", id);
    const data = await fetchFromApi(`competitions/${id}/participants`);
    console.log("📩 Respuesta de la API en /competitions/:id/participants:", data);
    res.json(data);
});

// Obtener stages de una competición
router.get('/:id/stages', async (req, res) => {
    const { id } = req.params;
    console.log("🔍 Petición recibida en /competitions/:id/stages con ID:", id);
    const data = await fetchFromApi(`competitions/${id}/stages`);
    console.log("📩 Respuesta de la API en /competitions/:id/stages:", data);
    res.json(data);
});

// Obtener participantes de un stage
router.get('/stage/:id/participants', async (req, res) => {
    const { id } = req.params;
    console.log("🔍 Petición recibida en /competitions/stage/:id/participants con ID:", id);
    const data = await fetchFromApi(`competitions/stage/${id}/participants`);
    console.log("📩 Respuesta de la API en /competitions/stage/:id/participants:", data);
    res.json(data);
});

// Obtener fixtures de un stage
router.get('/stage/:id/stagefixtures', async (req, res) => {
    const { id } = req.params;
    console.log("🔍 Petición recibida en /competitions/stage/:id/stagefixtures con ID:", id);
    const data = await fetchFromApi(`competitions/stage/${id}/stagefixtures`);
    console.log("📩 Respuesta de la API en /competitions/stage/:id/stagefixtures:", data);
    res.json(data);
});

export default router;
