import { useQuery } from '@tanstack/react-query';
import { databaseService } from '../services/database.service';
import { League } from '../types/database.types';

interface UseMatchesOptions {
    seasonId: string;
    league?: League;
    matchday?: number;
    enabled?: boolean;
    refetchInterval?: number;
}

export function useMatches({
    seasonId,
    league,
    matchday,
    enabled = true,
    refetchInterval = 30000 // 30 seconds for live updates
}: UseMatchesOptions) {
    return useQuery({
        queryKey: ['matches', seasonId, league, matchday],
        queryFn: () => databaseService.getMatches(seasonId, league, matchday),
        enabled,
        refetchInterval,
        staleTime: 10000, // Consider data stale after 10 seconds
    });
}

export function useMatchesByLeague(seasonId: string, league: League) {
    return useMatches({ seasonId, league });
}

export function useMatchesByMatchday(seasonId: string, matchday: number) {
    return useMatches({ seasonId, matchday });
}

// Hook to filter user's teams from matches
export function useUserMatches(
    seasonId: string,
    userTeamIds: string[],
    league?: League
) {
    const { data: matches, ...rest } = useMatches({ seasonId, league });

    const userMatches = matches?.filter(match =>
        userTeamIds.includes(match.home_team_id) ||
        userTeamIds.includes(match.away_team_id)
    );

    return {
        data: userMatches,
        ...rest
    };
}
