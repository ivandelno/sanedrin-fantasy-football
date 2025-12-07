import { useQuery } from '@tanstack/react-query';
import { databaseService } from '../services/database.service';

export function useStandingsHistory(seasonId: string, enabled: boolean = true) {
    return useQuery({
        queryKey: ['standings-history', seasonId],
        queryFn: () => databaseService.getStandingsHistory(seasonId),
        enabled,
        staleTime: 60000, // 1 minute
    });
}
