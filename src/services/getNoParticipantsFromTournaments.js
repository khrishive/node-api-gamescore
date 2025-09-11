import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = process.env.GAME_SCORE_API;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

export async function getParticipantsByTournamentId(tournamentId) {
    const API_URL = `https://api.gamescorekeeper.com/v1/competitions/${tournamentId}/fixtures`;

    try {
        const response = await axios.get(API_URL, {
            headers: {
                Authorization: AUTH_TOKEN,
            },
        });

        const fixtures = response.data.fixtures || [];
        const uniqueParticipantIds = new Set();

        for (const fixture of fixtures) {
            for (const participant of fixture.participants || []) {
                uniqueParticipantIds.add(participant.id);
            }
        }

        console.log(`🔢 Unique participants: ${uniqueParticipantIds.size}`);
        return {
            totalFixtures: fixtures.length,
            uniqueParticipantCount: uniqueParticipantIds.size,
            uniqueParticipantIds: [...uniqueParticipantIds],
            fixtures,
        };

    } catch (error) {
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error:', error.message);
        }
        return {
            totalFixtures: 0,
            uniqueParticipantCount: 0,
            uniqueParticipantIds: [],
            fixtures: [],
        };
    }
}

// Execute the function correctly using await
//getParticipantsByTournamentId(28941).then(console.log).catch(console.error);