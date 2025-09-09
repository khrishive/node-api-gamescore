import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Cargar la configuración desde config.json
const API_URL = process.env.GAME_SCORE_API;
const API_KEY = process.env.GAME_SCORE_APIKEY;

console.log("🔍 API_URL cargada:", API_URL);
console.log("🔍 API_KEY cargado:", API_KEY ? "DEFINIDO" : "NO DEFINIDO");

export const fetchFromApi = async (endpoint, params = {}) => {
    try {
        if (!API_URL || !API_KEY) {
            throw new Error("API_URL o API_KEY no están definidos en config.json");
        }
        console.log("🔍 Parámetros recibidos para la API:", params);

        const queryString = new URLSearchParams(params).toString();
        const fullUrl = `${API_URL}/${endpoint}?${queryString}`;

        console.log("🔍 URL construida para la API:", fullUrl);

        const response = await axios.get(fullUrl, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });

        console.log(response);

        console.log("✅ Respuesta de la API: :v", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error en fetchFromApi:", error.response?.data || error.message);
        return { error: "Error al obtener datos de la API", details: error.response?.data || error.message };
    }
};