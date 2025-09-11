import axios from 'axios';
import mysql from 'mysql2/promise';

// Gemini API Configuration
const apiKey = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

// MySQL Configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Function to get the description from Gemini
async function fetchTournamentDescription(tournamentName) {
    try {
        console.log(`🔍 Sending request to Gemini for the tournament: ${tournamentName}`);
        const response = await axios.post(GEMINI_API_URL, {
            contents: [{
                parts: [{ text: `Describe briefly the tournament '${tournamentName}'. Return a JSON object with 'description' as key.` }]
            }]
        }, {
            headers: { "Content-Type": "application/json" }
        });

        console.log(`🔍 Response from Gemini for ${tournamentName}:`, response.data);

        const responseText = response.data.candidates[0].content.parts[0].text;
        const extractedJson = responseText.match(/```json\n([\s\S]+?)\n```/);
        const jsonData = extractedJson ? JSON.parse(extractedJson[1]) : { description: null };

        return jsonData.description || null;
    } catch (error) {
        console.error(`❌ Error getting data from Gemini for ${tournamentName}:`, error.message);
        return null;
    }
}

// Main function to update the database
async function updateTournamentDescriptions() {
    let remainingTournaments;

    do {
        console.log("🚀 Starting description update...");
        const connection = await mysql.createConnection(dbConfig);

        try {
            // Get tournaments with NULL description
            const [tournaments] = await connection.execute("SELECT id, name FROM competitions WHERE description IS NULL");
            remainingTournaments = tournaments.length;
            console.log(`🔍 Tournaments found: ${remainingTournaments}`);

            for (const tournament of tournaments) {
                const { id, name } = tournament;
                const description = await fetchTournamentDescription(name);

                // Update the database with the new description
                await connection.execute("UPDATE competitions SET description = ? WHERE id = ?", [description, id]);
                console.log(`✅ Updated tournament '${name}' with description: ${description || 'NULL'}`);

                // Small delay between requests to avoid blocking
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error('❌ Error updating descriptions:', error);
            remainingTournaments = 0; // Exit loop in case of error
        } finally {
            await connection.end();
        }
    } while (remainingTournaments > 0);

    console.log("🏁 Process completed.");
}

// Execute the function
updateTournamentDescriptions();