import { useQuery } from '@tanstack/react-query';
import { databaseService } from '../services/database.service';
import { League } from '../types/database.types';

export function useTeams(league?: League) {
    return useQuery({
        queryKey: ['teams', league],
        queryFn: () => databaseService.getTeams(league),
        staleTime: 300000, // 5 minutes - teams don't change often
    });
}

export function useTeamsByLeague(league: League) {
    return useTeams(league);
}
