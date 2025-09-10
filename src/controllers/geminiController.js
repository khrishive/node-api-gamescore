import axios from 'axios';

// Configuración de la API de Gemini
const apiKey = process.env.GEMINI_API_KEY;
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

export const askGemini = async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: "Falta la pregunta en el cuerpo de la solicitud" });
    }

    try {
        const response = await axios.post(endpoint, {
            contents: [{ parts: [{ text: question }] }]
        }, {
            headers: { "Content-Type": "application/json" }
        });
    
        const respuestaTexto = response.data.candidates[0].content.parts[0].text;
    
        // Expresión regular para encontrar el premio en dinero
        const match = respuestaTexto.match(/(?:\$\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/);
        const premio = match ? match[0] : "No especificado"; // Si no encuentra el premio, pone "No especificado"
    
        // Eliminar la parte del premio del texto principal
        const descripcion = match ? respuestaTexto.replace(match[0], "").trim() : respuestaTexto;
    
        console.log("✅ Descripción del torneo:", descripcion);
        console.log("🏆 Premio:", premio);
    
        res.status(200).json({ descripcion, premio });
    } catch (error) {
        console.error("❌ Error en la API de Gemini:", error.response?.data || error.message);
        res.status(500).json({ error: "Error al comunicarse con Gemini" });
    }
    
    
};
