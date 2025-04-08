import express from 'express';
import { fetchFromApi } from '../controllers/apiController.js';

const router = express.Router();

// Obtener detalles de una competición por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    console.log("🔍 Petición recibida en /teams/:id con ID:", id);
    const data = await fetchFromApi(`teams/${id}`);
    console.log("📩 Respuesta de la API en /teams/:id:", data);
    res.json(data);
});

export default router;