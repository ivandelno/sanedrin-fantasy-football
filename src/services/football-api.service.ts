import { footballApi, LEAGUE_CONFIG } from '../config/football-api';
import type {
    APIFootballResponse,
    APIMatch,
    APITeam
} from '../types/api.types';
import { STATUS_MAP } from '../types/api.types';
import { League, MatchStatus } from '../types/database.types';
import { databaseService } from './database.service';

class FootballApiService {
    /**
     * Fetch matches for a specific league and season
     */
    async getMatches(league: League, season: number = 2024): Promise<APIMatch[]> {
        try {
            const leagueId = LEAGUE_CONFIG[league].id;

            const response = await footballApi.get<APIFootballResponse<APIMatch>>('/fixtures', {
                params: {
                    league: leagueId,
                    season: season,
                }
            });

            return response.data.response;
        } catch (error) {
            console.error(`Error fetching matches for ${league}:`, error);
            throw error;
        }
    }

    /**
     * Fetch matches for a specific matchday
     */
    async getMatchesByMatchday(league: League, matchday: number, season: number = 2024): Promise<APIMatch[]> {
        try {
            const leagueId = LEAGUE_CONFIG[league].id;

            const response = await footballApi.get<APIFootballResponse<APIMatch>>('/fixtures', {
                params: {
                    league: leagueId,
                    season: season,
                    round: `Regular Season - ${matchday}`
                }
            });

            return response.data.response;
        } catch (error) {
            console.error(`Error fetching matchday ${matchday} for ${league}:`, error);
            throw error;
        }
    }

    /**
     * Fetch current matchday for a league
     */
    async getCurrentMatchday(league: League, season: number = 2024): Promise<number> {
        try {
            const leagueId = LEAGUE_CONFIG[league].id;

            const response = await footballApi.get<APIFootballResponse<any>>('/fixtures/rounds', {
                params: {
                    league: leagueId,
                    season: season,
                    current: true
                }
            });

            if (response.data.response.length > 0) {
                const round = response.data.response[0];
                // Extract matchday number from string like "Regular Season - 14"
                const match = round.match(/\d+/);
                return match ? parseInt(match[0]) : 1;
            }

            return 1;
        } catch (error) {
            console.error(`Error fetching current matchday for ${league}:`, error);
            return 1;
        }
    }

    /**
     * Fetch all teams for a league
     */
    async getTeams(league: League, season: number = 2024): Promise<APITeam[]> {
        try {
            const leagueId = LEAGUE_CONFIG[league].id;

            const response = await footballApi.get<APIFootballResponse<{ team: APITeam }>>('/teams', {
                params: {
                    league: leagueId,
                    season: season
                }
            });

            return response.data.response.map(item => item.team);
        } catch (error) {
            console.error(`Error fetching teams for ${league}:`, error);
            throw error;
        }
    }

    /**
     * Fetch live matches
     */
    async getLiveMatches(): Promise<APIMatch[]> {
        try {
            const response = await footballApi.get<APIFootballResponse<APIMatch>>('/fixtures', {
                params: {
                    live: 'all'
                }
            });

            // Filter only matches from our leagues
            const ourLeagueIds = Object.values(LEAGUE_CONFIG).map(config => config.id);
            return response.data.response.filter(match =>
                ourLeagueIds.includes(match.league.id as any)
            );
        } catch (error) {
            console.error('Error fetching live matches:', error);
            return [];
        }
    }

    /**
     * Map API status to our database status
     */
    mapStatus(apiStatus: string): MatchStatus {
        const status = STATUS_MAP[apiStatus];
        if (status === 'FINISHED') return MatchStatus.FINISHED;
        if (status === 'LIVE') return MatchStatus.LIVE;
        if (status === 'POSTPONED') return MatchStatus.POSTPONED;
        return MatchStatus.SCHEDULED;
    }

    /**
     * Normalize team name for database matching
     */
    normalizeTeamName(apiName: string): string {
        // Remove common suffixes and normalize
        return apiName
            .replace(/\s+(FC|CF|CD|UD|SD|AD)$/i, '')
            .trim()
            .toLowerCase();
    }

    /**
     * Sync matches from API to Database
     * Note: Free API plan only supports date-based queries
     */
    async syncMatches(dbSeasonId: string): Promise<{ total: number; updated: number; errors: string[] }> {
        const errors: string[] = [];
        let totalMatches = 0;
        let updatedMatches = 0;

        // Sync only today's date (for automatic updates every 15 min)
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];

        console.log(`Syncing matches for: ${dateStr}`);

        try {
            // Get all matches for this date
            const response = await footballApi.get<APIFootballResponse<APIMatch>>('/fixtures', {
                params: { date: dateStr }
            });

            const dayMatches = response.data.response;
            console.log(`Found ${dayMatches.length} total matches on ${dateStr}`);

            // Filter for our leagues
            const ourLeagueIds = Object.values(LEAGUE_CONFIG).map(config => config.id);
            const relevantMatches = dayMatches.filter(match =>
                ourLeagueIds.includes(match.league.id as any)
            );

            console.log(`  -> ${relevantMatches.length} matches for our leagues`);

            for (const apiMatch of relevantMatches) {
                totalMatches++;

                // Determine which league this match belongs to
                let league: League | null = null;
                if (apiMatch.league.id === LEAGUE_CONFIG.PRIMERA.id) league = League.PRIMERA;
                else if (apiMatch.league.id === LEAGUE_CONFIG.SEGUNDA.id) league = League.SEGUNDA;
                else if (apiMatch.league.id === LEAGUE_CONFIG.CHAMPIONS.id) league = League.CHAMPIONS;

                if (!league) continue;

                // 1. Resolve Team IDs
                const homeTeamId = await databaseService.getTeamIdByApiName(apiMatch.teams.home.name, league);
                const awayTeamId = await databaseService.getTeamIdByApiName(apiMatch.teams.away.name, league);

                if (!homeTeamId || !awayTeamId) {
                    const missing = !homeTeamId ? apiMatch.teams.home.name : apiMatch.teams.away.name;
                    const errorMsg = `Team not found: ${missing} (${league})`;
                    if (!errors.includes(errorMsg)) {
                        errors.push(errorMsg);
                    }
                    continue;
                }

                // 2. Map Status
                const status = this.mapStatus(apiMatch.fixture.status.short);

                // 3. Extract Matchday (if available in round string)
                let matchday = 1;
                if (apiMatch.league.round) {
                    const matchdayStr = apiMatch.league.round.match(/\d+/);
                    matchday = matchdayStr ? parseInt(matchdayStr[0]) : 1;
                }

                // 4. Upsert Match
                const matchData = {
                    season_id: dbSeasonId,
                    league: league,
                    matchday: matchday,
                    home_team_id: homeTeamId,
                    away_team_id: awayTeamId,
                    home_score: apiMatch.goals.home,
                    away_score: apiMatch.goals.away,
                    status: status,
                    utc_datetime: apiMatch.fixture.date,
                    external_ref: String(apiMatch.fixture.id)
                };

                await databaseService.upsertMatch(matchData);
                updatedMatches++;

                // CRITICAL: If the match is FINISHED, we must force points recalculation.
                // The database trigger usually only fires on UPDATE, so if we INSERT a match directly as FINISHED,
                // or if we UPSERT and it was already FINISHED, the trigger might not fire or calculate correctly.
                // We do this manually here to be 100% safe.
                if (status === MatchStatus.FINISHED) {
                    // We need the ID of the inserted/updated match. 
                    // upsertMatch returns the full match object with ID.
                    // IMPORTANT: We need to await this to ensure sequential processing.
                    const savedMatch = await databaseService.upsertMatch(matchData);
                    if (savedMatch && savedMatch.id) {
                        await databaseService.calculateMatchPoints(savedMatch.id);
                    }
                }
            }

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`Error syncing date ${dateStr}:`, error);
            errors.push(`Failed to sync ${dateStr}: ${errorMsg}`);
        }

        return { total: totalMatches, updated: updatedMatches, errors };
    }
}

export const footballApiService = new FootballApiService();
