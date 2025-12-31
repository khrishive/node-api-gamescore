import axios from 'axios';
import dotenv from 'dotenv';
import { getTeams, getTeamById } from '../services/teamsService.js';
dotenv.config();

// Load configuration from config.json
const API_URL = process.env.GAME_SCORE_API;
const API_KEY = process.env.GAME_SCORE_APIKEY;

export const fetchFromApi = async (endpoint, params = {}) => {
    try {
        if (!API_URL || !API_KEY) {
            throw new Error("API_URL or API_KEY are not defined in config.json");
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
        console.error("❌ Error in fetchFromApi:", error.response?.data || error.message);
        return { error: "Error fetching data from API", details: error.response?.data || error.message };
    }
};

// src/controllers/teamsController.js
export const getTeamsController = async (req, res) => {
    try {
        const { sport } = req.query;

        console.log('🔍 GET /teams | sport:', sport);

        const teams = await getTeams({ sport });

        res.json({
            count: teams.length,
            data: teams,
        });
    } catch (error) {
        console.error('❌ Error fetching teams:', error);
        res.status(500).json({
            error: 'Error fetching teams',
        });
    }
};

export const getTeamByIdController = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('🔍 GET /teams/:id | id:', id);

        const team = await getTeamById(id);

        if (!team) {
            return res.status(404).json({
                error: 'Team not found',
            });
        }

        res.json(team);
    } catch (error) {
        console.error('❌ Error fetching team by id:', error);
        res.status(500).json({
            error: 'Error fetching team',
        });
    }
};
