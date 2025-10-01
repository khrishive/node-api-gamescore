import axios from 'axios';

// Gemini API configuration
const apiKey = process.env.GEMINI_API_KEY;
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

export const askGemini = async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: "Missing question in the request body" });
    }

    try {
        const response = await axios.post(endpoint, {
            contents: [{ parts: [{ text: question }] }]
        }, {
            headers: { "Content-Type": "application/json" }
        });
    
        const textResponse = response.data.candidates[0].content.parts[0].text;
    
        // Regular expression to find the prize money
        const match = textResponse.match(/(?:\$\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/);
        const prize = match ? match[0] : "Not specified"; // If it does not find the prize, it puts "Not specified"
    
        // Remove the prize part from the main text
        const description = match ? textResponse.replace(match[0], "").trim() : textResponse;
    
        console.log("✅ Tournament description:", description);
        console.log("🏆 Prize:", prize);
    
        res.status(200).json({ description, prize });
    } catch (error) {
        console.error("❌ Error in Gemini API:", error.response?.data || error.message);
        res.status(500).json({ error: "Error communicating with Gemini" });
    }
    
    
};