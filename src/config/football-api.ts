import axios from 'axios';
import { LEAGUE_IDS } from '../types/api.types';

// API-Football configuration
// Get your free API key from: https://www.api-football.com/
// Support both Vite (import.meta.env) and Node.js (process.env)
const API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FOOTBALL_API_KEY)
    || (typeof process !== 'undefined' && process.env?.VITE_FOOTBALL_API_KEY)
    || 'e223a5ff8ea64524bf596aa5abc37aad';
const API_BASE_URL = 'https://v3.football.api-sports.io';

export const footballApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'x-apisports-key': API_KEY,
    },
    timeout: 10000,
});

// Rate limiting: Free tier allows 100 requests per day
let requestCount = 0;
const MAX_REQUESTS_PER_DAY = 100;

footballApi.interceptors.request.use((config) => {
    if (requestCount >= MAX_REQUESTS_PER_DAY) {
        throw new Error('API rate limit reached for today');
    }
    requestCount++;
    return config;
});

footballApi.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Football API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const LEAGUE_CONFIG = {
    PRIMERA: {
        id: LEAGUE_IDS.LA_LIGA,
        name: 'La Liga',
        season: 2023,
    },
    SEGUNDA: {
        id: LEAGUE_IDS.SEGUNDA,
        name: 'Segunda División',
        season: 2023,
    },
    CHAMPIONS: {
        id: LEAGUE_IDS.CHAMPIONS,
        name: 'UEFA Champions League',
        season: 2023,
    },
} as const;

export { LEAGUE_IDS };
