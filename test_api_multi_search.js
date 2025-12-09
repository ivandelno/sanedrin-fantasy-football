import axios from 'axios';

const API_KEY = '43d7cc6a49014761160dcebbe549a76a';
const API_BASE_URL = 'https://v3.football.api-sports.io';
// const TARGET_DATE = '2025-12-07';
// Checking a range to be sure, or just the specific date.
// User insisted on Dec 7th.

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'x-apisports-key': API_KEY }
});

async function checkDate(date) {
    // Known Segunda RFEF Groups often mirror Tercera or follow sequence. 
    // From previous output: Group 1 is 875. Play-offs is 1000.
    // Let's try searching for ANY fixture on this date if possible (requires plan?), or iterate a few IDs.
    // Since we know Group 1 is 875, let's check it again and check recent results if empty.

    // Also Check League 1000 (Play-offs)
    const leagueIds = [875, 876, 877, 878, 879, 1000]; // Trying potential IDs for groups 1-5 + playoffs

    console.log(`\n=== Checking Fixtures for Date: ${date} ===`);

    for (const id of leagueIds) {
        try {
            const response = await api.get('/fixtures', {
                params: {
                    date: date,
                    league: id,
                    season: 2025
                }
            });
            const fixtures = response.data.response;
            if (fixtures.length > 0) {
                console.log(`\n✅ League ID ${id}: Found ${fixtures.length} matches.`);
                fixtures.forEach(f => {
                    const home = f.teams.home.name;
                    const away = f.teams.away.name;
                    const score = `${f.goals.home ?? '-'} - ${f.goals.away ?? '-'}`;
                    const status = f.fixture.status.short;
                    const leagueName = f.league.name;

                    if (home.includes('Avila') || away.includes('Avila') || home.includes('Ávila') || away.includes('Ávila')) {
                        console.log(`   >>> 🎯 [${leagueName}] ${home} vs ${away} [${score}] (${status}) <<<`);
                    } else {
                        console.log(`   - [${leagueName}] ${home} vs ${away} [${score}] (${status})`);
                    }
                });
            } else {
                // console.log(`League ID ${id}: No matches.`);
            }
        } catch (e) {
            // console.log(`League ID ${id}: Error or not available.`);
        }
    }
}

// Check Dec 7th specifically as requested
checkDate('2025-12-07');
