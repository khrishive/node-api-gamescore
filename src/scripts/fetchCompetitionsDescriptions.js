import axios from 'axios';
import { getDbBySport } from '../utils/dbUtils.js';

// Gemini API Configuration
const apiKey = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

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
async function updateTournamentDescriptions(sport = 'cs2') {
    const db = getDbBySport(sport);
    let remainingTournaments;

    do {
        console.log(`🚀 Starting description update for ${sport}...`);

        try {
            // Get tournaments with NULL description
            const [tournaments] = await db.execute("SELECT id, name FROM competitions WHERE description IS NULL");
            remainingTournaments = tournaments.length;
            console.log(`🔍 Tournaments found: ${remainingTournaments}`);

            if (remainingTournaments === 0) {
                console.log('No tournaments to update.');
                break;
            }

            for (const tournament of tournaments) {
                const { id, name } = tournament;
                const description = await fetchTournamentDescription(name);

                // Update the database with the new description
                await db.execute("UPDATE competitions SET description = ? WHERE id = ?", [description, id]);
                console.log(`✅ Updated tournament '${name}' with description: ${description || 'NULL'}`);

                // Small delay between requests to avoid blocking
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error('❌ Error updating descriptions:', error);
            remainingTournaments = 0; // Exit loop in case of error
        }
    } while (remainingTournaments > 0);

    console.log(`🏁 Process completed for ${sport}.`);
}

// Execute the function
// Get sport from command-line arguments, default to 'cs2'
const sport = process.argv[2] || 'cs2';
updateTournamentDescriptions(sport);
