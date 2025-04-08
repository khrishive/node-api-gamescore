import express from 'express';
import { fetchFromApi } from '../controllers/apiController.js';

const router = express.Router();

// Obtener detalles de un jugador por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    console.log("🔍 Petición recibida en /players/:id con ID:", id);
    const data = await fetchFromApi(`players/${id}`);
    console.log("📩 Respuesta de la API en /players/:id:", data);
    res.json(data);
});

// Obtener detalles de los stats de un jugador por ID
router.get('/stats/player/:id', async (req, res) => {
    const { id } = req.params;
    console.log("🔍 Petición recibida en /players/:id con ID:", id);
    const data = await fetchFromApi(`stats/player/${id}`);
    console.log("📩 Respuesta de la API en /stats/player/:id:", data);
    res.json(data);
});

export default router;