import axios from 'axios';

const API_KEY = '43d7cc6a49014761160dcebbe549a76a';
const API_BASE_URL = 'https://v3.football.api-sports.io';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'x-apisports-key': API_KEY,
    }
});

async function checkRealAvilaLastMatches() {
    try {
        const teamId = 9736; // Real Ávila

        console.log(`Fetching LAST 10 fixtures for Real Ávila (ID: ${teamId})...`);

        // API-Football allows getting "last X" matches for a team
        const response = await api.get('/fixtures', {
            params: {
                team: teamId,
                last: 10
            }
        });

        const fixtures = response.data.response;

        if (fixtures.length === 0) {
            console.log("No matches found at all.");
            return;
        }

        console.log(`Found ${fixtures.length} matches.`);
        console.log("---------------------------------------------------");

        fixtures.forEach(f => {
            const home = f.teams.home.name;
            const away = f.teams.away.name;
            const score = `${f.goals.home ?? '-'} - ${f.goals.away ?? '-'}`;
            const date = f.fixture.date;
            const league = f.league.name;
            const season = f.league.season;

            console.log(`[${date}] (${season}) ${league}: ${home} vs ${away} [${score}]`);
        });
        console.log("---------------------------------------------------");

    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

checkRealAvilaLastMatches();
