import axios from 'axios';

const API_KEY = '43d7cc6a49014761160dcebbe549a76a';
const API_BASE_URL = 'https://v3.football.api-sports.io';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'x-apisports-key': API_KEY,
    }
});

async function checkRealAvila() {
    try {
        console.log("Searching for Real Ávila...");
        const teamResponse = await api.get('/teams', {
            params: {
                search: 'Real Avila'
            }
        });

        const teams = teamResponse.data.response;
        if (teams.length === 0) {
            console.log("Team 'Real Avila' not found.");
            return;
        }

        const teamData = teams[0];
        console.log(`Found Team: ${teamData.team.name} (ID: ${teamData.team.id})`);

        const teamId = teamData.team.id;

        // Check 2025 (as requested)
        console.log(`\nFetching fixtures for team ID ${teamId} (Season 2025)...`);

        // Let's try to get all matches for 2025 first to see what's there
        const fixturesResponse2025 = await api.get('/fixtures', {
            params: { team: teamId, season: 2025 }
        });

        const allFixtures = fixturesResponse2025.data.response;

        if (allFixtures.length > 0) {
            console.log(`Found ${allFixtures.length} matches in 2025.`);

            // Check for today's match (2025-12-07)
            const todayStr = '2025-12-07';
            console.log(`Checking for match on ${todayStr}...`);

            const todaysMatch = allFixtures.find(f => f.fixture.date.startsWith(todayStr));

            if (todaysMatch) {
                console.log(`\nMATCH FOUND TODAY!`);
                console.log(`- Date: ${todaysMatch.fixture.date}`);
                console.log(`- Status: ${todaysMatch.fixture.status.long} (${todaysMatch.fixture.status.short})`);
                console.log(`- League: ${todaysMatch.league.name} (ID: ${todaysMatch.league.id})`);
                console.log(`- Teams: ${todaysMatch.teams.home.name} ${todaysMatch.goals.home ?? '-'} vs ${todaysMatch.goals.away ?? '-'} ${todaysMatch.teams.away.name}`);
            } else {
                console.log(`No match found specifically for today (${todayStr}).`);
                console.log("Here are the last 3 matches:");
                allFixtures.slice(-3).forEach(f => {
                    console.log(`- [${f.fixture.date}] ${f.teams.home.name} vs ${f.teams.away.name} (${f.league.name})`);
                });
            }

        } else {
            console.log("No matches found in 2025.");
        }

    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

checkRealAvila();
