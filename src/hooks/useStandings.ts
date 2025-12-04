import { useQuery } from '@tanstack/react-query';
import { databaseService } from '../services/database.service';

export function useStandings(seasonId: number, enabled: boolean = true) {
    return useQuery({
        queryKey: ['standings', seasonId],
        queryFn: () => databaseService.getStandings(seasonId),
        enabled,
        staleTime: 60000, // 1 minute
        refetchInterval: 60000, // Refetch every minute
    });
}

export function useUserPosition(seasonId: number, userId: number) {
    const { data: standings, ...rest } = useStandings(seasonId);

    const userStanding = standings?.find(s => s.user_id === userId);
    const position = userStanding?.position || 0;
    const points = userStanding?.total_points || 0;

    // Calculate position change (would need historical data)
    const positionChange = 0; // TODO: Implement with historical data

    return {
        position,
        points,
        positionChange,
        standing: userStanding,
        ...rest
    };
}
