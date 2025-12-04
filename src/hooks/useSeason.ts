import { useQuery } from '@tanstack/react-query';
import { databaseService } from '../services/database.service';

export function useActiveSeason() {
    return useQuery({
        queryKey: ['season', 'active'],
        queryFn: () => databaseService.getActiveSeason(),
        staleTime: 300000, // 5 minutes
    });
}
