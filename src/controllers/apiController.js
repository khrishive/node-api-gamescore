import axios from 'axios';

// Cargar la configuración desde config.json
const API_URL = process.env.GAME_SCORE_API;
const API_KEY = process.env.GAME_SCORE_APIKEY;

export const fetchFromApi = async (endpoint, params = {}) => {
    try {
        if (!API_URL || !API_KEY) {
            throw new Error("API_URL o API_KEY no están definidos en config.json");
        }

        const queryString = new URLSearchParams(params).toString();
        const fullUrl = `${API_URL}/${endpoint}?${queryString}`;

        const response = await axios.get(fullUrl, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });

        return response.data;
    } catch (error) {
        console.error("❌ Error en fetchFromApi:", error.response?.data || error.message);
        return { error: "Error al obtener datos de la API", details: error.response?.data || error.message };
    }
};