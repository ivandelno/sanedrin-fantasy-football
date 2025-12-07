import { supabase } from '../config/supabase';
import type {
    Match,
    MatchWithTeams,
    Team,
    ParticipantStanding,
    Season,
    ParticipantSelection,
    User,
    ParticipantTeamSummary,
    StandingsHistoryEntry
} from '../types/database.types';
import { League, MatchStatus } from '../types/database.types';

class DatabaseService {
    // ============================================
    // Matches
    // ============================================

    async getMatches(seasonId: string, league?: League, matchday?: number): Promise<MatchWithTeams[]> {
        let query = supabase
            .from('matches')
            .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*)
      `)
            .eq('season_id', seasonId)
            .order('utc_datetime', { ascending: true });

        if (league) {
            query = query.eq('league', league);
        }

        if (matchday !== undefined) {
            query = query.eq('matchday', matchday);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as MatchWithTeams[];
    }

    async upsertMatch(match: Partial<Match>): Promise<Match> {
        const { data, error } = await supabase
            .from('matches')
            .upsert(match, {
                onConflict: 'season_id,league,matchday,home_team_id,away_team_id'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateMatchResult(matchId: string, homeScore: number, awayScore: number, status: MatchStatus): Promise<void> {
        const { error } = await supabase
            .from('matches')
            .update({
                home_score: homeScore,
                away_score: awayScore,
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', matchId);

        if (error) throw error;

        // Trigger points calculation if match is finished
        if (status === 'FINISHED') {
            await this.calculateMatchPoints(matchId);
        }
    }

    async calculateMatchPoints(matchId: string): Promise<void> {
        const { error } = await supabase.rpc('calculate_match_points', {
            p_match_id: matchId
        });

        if (error) {
            console.error('Error calculating match points:', error);
            throw error;
        }
    }

    // ============================================
    // Teams
    // ============================================

    async getTeams(league?: League): Promise<Team[]> {
        let query = supabase
            .from('teams')
            .select('*')
            .order('name');

        if (league) {
            query = query.eq('league', league);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    }

    async upsertTeam(team: Partial<Team>): Promise<Team> {
        const { data, error } = await supabase
            .from('teams')
            .upsert(team, {
                onConflict: 'name,league'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async syncTeamsFromApi(teams: Array<{ name: string; league: League; external_id: string; logo_url?: string }>): Promise<void> {
        const { error } = await supabase
            .from('teams')
            .upsert(teams, {
                onConflict: 'name,league'
            });

        if (error) throw error;
    }

    async getTeamIdByApiName(apiName: string, league: League): Promise<string | null> {
        // Note: team_name_mappings table doesn't exist yet
        // For now, we only do direct matching

        // 1. Try exact match in teams table
        const { data: team } = await supabase
            .from('teams')
            .select('id')
            .eq('name', apiName)
            .eq('league', league)
            .single();

        if (team) return team.id;

        // 2. Try case-insensitive match
        const { data: teams } = await supabase
            .from('teams')
            .select('id, name')
            .eq('league', league);

        if (teams) {
            const match = teams.find(t =>
                t.name.toLowerCase() === apiName.toLowerCase()
            );
            if (match) return match.id;
        }

        // Not found
        return null;
    }

    // ============================================
    // Standings
    // ============================================

    // ============================================
    // Standings
    // ============================================

    async getStandings(seasonId: string): Promise<ParticipantStanding[]> {
        const { data, error } = await supabase.rpc('get_participant_standings', {
            p_season_id: seasonId
        });

        if (error) throw error;
        return data;
    }

    async getStandingsHistory(seasonId: string): Promise<StandingsHistoryEntry[]> {
        const { data, error } = await supabase.rpc('get_standings_history', {
            p_season_id: seasonId
        });

        if (error) throw error;
        return data;
    }

    // ============================================
    // Participant Selections
    // ============================================

    async getParticipantSelections(participantId: string): Promise<ParticipantSelection[]> {
        const { data, error } = await supabase
            .from('participant_selections')
            .select('*')
            .eq('participant_id', participantId);

        if (error) throw error;
        return data;
    }

    async saveParticipantSelections(selections: Partial<ParticipantSelection>[]): Promise<void> {
        const { error } = await supabase
            .from('participant_selections')
            .upsert(selections);

        if (error) throw error;
    }

    async submitParticipantSelections(participantId: string): Promise<void> {
        const { error } = await supabase
            .from('season_participants')
            .update({ selection_submitted: true })
            .eq('id', participantId);

        if (error) throw error;
    }

    // ============================================
    // Teams Summary
    // ============================================

    async getParticipantsTeamsSummary(seasonId: string): Promise<ParticipantTeamSummary[]> {
        const { data, error } = await supabase.rpc('get_participants_teams_summary', {
            p_season_id: seasonId
        });

        if (error) throw error;
        return data;
    }

    // ============================================
    // Seasons
    // ============================================

    async getActiveSeason(): Promise<Season | null> {
        const { data, error } = await supabase
            .from('seasons')
            .select('*')
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        return data;
    }

    async createSeason(name: string): Promise<Season> {
        const { data, error } = await supabase
            .from('seasons')
            .insert({ name, is_active: false })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateSeason(id: string, updates: Partial<Season>): Promise<Season> {
        const { data, error } = await supabase
            .from('seasons')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // ============================================
    // Users
    // ============================================

    async getUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('id, username, is_admin, created_at')
            .order('username');

        if (error) throw error;
        return data;
    }

    async createUser(username: string, password: string, isAdmin: boolean = false): Promise<User> {
        const { data, error } = await supabase.rpc('create_user', {
            p_username: username,
            p_password: password,
            p_is_admin: isAdmin
        });

        if (error) throw error;
        return data;
    }

    // ============================================
    // News
    // ============================================

    async getNews(seasonId: string, publishedOnly: boolean = true): Promise<any[]> {
        let query = supabase
            .from('news')
            .select(`
        *,
        author:users!news_author_user_id_fkey(id, username),
        likes:news_likes(count),
        comments:news_comments(count)
      `)
            .eq('season_id', seasonId)
            .order('created_at', { ascending: false });

        if (publishedOnly) {
            query = query.eq('published', true);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    }

    async createNews(seasonId: string, authorUserId: string, title: string, content: string): Promise<any> {
        const { data, error } = await supabase
            .from('news')
            .insert({
                season_id: seasonId,
                author_user_id: authorUserId,
                title,
                content,
                published: false
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async publishNews(newsId: string): Promise<void> {
        const { error } = await supabase
            .from('news')
            .update({ published: true })
            .eq('id', newsId);

        if (error) throw error;
    }
}

export const databaseService = new DatabaseService();
