import axios from 'axios';

const API_KEY = '43d7cc6a49014761160dcebbe549a76a';
const API_BASE_URL = 'https://v3.football.api-sports.io';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'x-apisports-key': API_KEY }
});

async function findSpainLeagues() {
    try {
        console.log("Fetching leagues for country 'Spain'...");

        const response = await api.get('/leagues', {
            params: {
                country: 'Spain'
            }
        });

        const leagues = response.data.response;
        console.log(`Found ${leagues.length} leagues in Spain.`);

        // Filter for potential Segunda RFEF candidates
        const candidates = leagues.filter(l =>
            l.league.name.includes('Segunda') ||
            l.league.name.includes('Federación') ||
            l.league.name.includes('RFEF')
        );

        console.log(`\nPotential candidates (${candidates.length}):`);
        for (const l of candidates) {
            console.log(`- [${l.league.id}] ${l.league.name} (${l.league.type})`);

            // Check coverage for 2024 and 2025
            const s2024 = l.seasons.find(s => s.year === 2024);
            const s2025 = l.seasons.find(s => s.year === 2025);

            if (s2024) console.log(`  > 2024: ${s2024.start} to ${s2024.end} (Cv: ${s2024.coverage.fixtures.events})`);
            if (s2025) console.log(`  > 2025: ${s2025.start} to ${s2025.end} (Cv: ${s2025.coverage.fixtures.events})`);
        }

    } catch (e) {
        console.error(e.message);
    }
}

findSpainLeagues();
