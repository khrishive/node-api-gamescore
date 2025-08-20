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

        console.log(`🔢 Participantes únicos: ${uniqueParticipantIds.size}`);
        return {
            totalFixtures: fixtures.length,
            uniqueParticipantCount: uniqueParticipantIds.size,
            uniqueParticipantIds: [...uniqueParticipantIds],
            fixtures,
        };

    } catch (error) {
        if (error.response) {
            console.error('Statusss:', error.response.status);
            console.error('Dataaa:', error.response.data);
        } else if (error.request) {
            console.error('No response receiveddd:', error.request);
        } else {
            console.error('Errorrr:', error.message);
        }
        return {
            totalFixtures: 0,
            uniqueParticipantCount: 0,
            uniqueParticipantIds: [],
            fixtures: [],
        };
    }
}

// Ejecuta la función correctamente usando await
//getParticipantsByTournamentId(28941).then(console.log).catch(console.error);
