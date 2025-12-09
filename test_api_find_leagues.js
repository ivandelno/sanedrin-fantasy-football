import axios from 'axios';

const API_KEY = '43d7cc6a49014761160dcebbe549a76a';
const API_BASE_URL = 'https://v3.football.api-sports.io';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'x-apisports-key': API_KEY }
});

async function findLeagues() {
    try {
        console.log("Searching for 'Segunda RFEF' or similar leagues...");

        // Search by name
        const response = await api.get('/leagues', {
            params: {
                search: 'Segunda Federación'
            }
        });

        const leagues = response.data.response;
        console.log(`Found ${leagues.length} leagues.`);

        for (const l of leagues) {
            console.log(`- [${l.league.id}] ${l.league.name} (${l.country.name})`);
            // Check if active in 2025
            const s2025 = l.seasons.find(s => s.year === 2025);
            if (s2025) {
                console.log(`  > Coverage 2025: ${s2025.start} to ${s2025.end}`);
            }
        }

    } catch (e) {
        console.error(e.message);
    }
}

findLeagues();
