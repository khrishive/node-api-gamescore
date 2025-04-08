import axios from 'axios';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la API de Gemini
const apiKey = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

// Configuración de MySQL
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Función para obtener la descripción desde Gemini
async function fetchTournamentDescription(tournamentName) {
    try {
        console.log(`🔍 Enviando solicitud a Gemini para el torneo: ${tournamentName}`);
        const response = await axios.post(GEMINI_API_URL, {
            contents: [{
                parts: [{ text: `Describe briefly the tournament '${tournamentName}'. Return a JSON object with 'description' as key.` }]
            }]
        }, {
            headers: { "Content-Type": "application/json" }
        });

        console.log(`🔍 Respuesta de Gemini para ${tournamentName}:`, response.data);

        const responseText = response.data.candidates[0].content.parts[0].text;
        const extractedJson = responseText.match(/```json\n([\s\S]+?)\n```/);
        const jsonData = extractedJson ? JSON.parse(extractedJson[1]) : { description: "Sin descripción" };

        return jsonData.description || "Sin descripción";
    } catch (error) {
        console.error(`❌ Error obteniendo datos de Gemini para ${tournamentName}:`, error.message);
        return "Sin descripción";
    }
}

// Función principal para actualizar la base de datos
async function updateTournamentDescriptions() {
    let remainingTournaments;

    do {
        console.log("🚀 Iniciando la actualización de descripciones...");
        const connection = await mysql.createConnection(dbConfig);

        try {
            // Obtener torneos con "Sin descripción"
            const [tournaments] = await connection.execute("SELECT id, name FROM competitions WHERE description = 'Sin descripción'");
            remainingTournaments = tournaments.length;
            console.log(`🔍 Torneos encontrados: ${remainingTournaments}`);

            for (const tournament of tournaments) {
                const { id, name } = tournament;
                const description = await fetchTournamentDescription(name);

                // Actualizar la base de datos con la nueva descripción
                await connection.execute("UPDATE competitions SET description = ? WHERE id = ?", [description, id]);
                console.log(`✅ Actualizado torneo '${name}' con descripción: ${description}`);

                // Pequeño retraso entre solicitudes para evitar bloqueos
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error('❌ Error al actualizar las descripciones:', error);
            remainingTournaments = 0; // Salir del bucle en caso de error
        } finally {
            await connection.end();
        }
    } while (remainingTournaments > 0);

    console.log("🏁 Proceso completado.");
}

// Ejecutar la función
updateTournamentDescriptions();