
import fs from 'fs';
import path from 'path';

// Manual .env loading
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env from:', envPath);

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
    console.log('.env loaded.');
}

import { footballApi } from '../config/football-api';

async function debugMatches() {
    console.log('--- STARTING DEBUG WITH NEW KEY ---');
    const dateStr = '2025-12-14';

    // Check which key is used (mask it)
    const currentKey = footballApi.defaults.headers['x-apisports-key'];
    console.log('Using API Key:', String(currentKey).substring(0, 5) + '...');

    try {
        console.log(`Fetching matches for date: ${dateStr}...`);
        const response = await footballApi.get('/fixtures', {
            params: { date: dateStr }
        });

        console.log('Response Status:', response.status);
        console.log('Response Errors:', JSON.stringify(response.data.errors, null, 2));
        console.log('Response Results:', response.data.results);

        if (response.data.response.length > 0) {
            const m = response.data.response[0];
            console.log(`Sample Match: ${m.teams.home.name} vs ${m.teams.away.name}`);
        }

    } catch (error: any) {
        console.error('Request Failed:', error.message);
        if (error.response) {
            console.log('Error Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
    console.log('--- END DEBUG ---');
}

debugMatches();
