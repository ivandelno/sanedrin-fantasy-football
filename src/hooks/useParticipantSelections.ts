import { useQuery } from '@tanstack/react-query';
import { databaseService } from '../services/database.service';
import { supabase } from '../config/supabase';

export function useParticipantSelections(userId: string | undefined, seasonId: string | undefined, enabled: boolean = true) {
    return useQuery({
        queryKey: ['participant-selections', userId, seasonId],
        queryFn: async () => {
            if (!userId || !seasonId) return null;

            // First, get the participant ID for this user in this season
            const { data: participant, error: participantError } = await supabase
                .from('season_participants')
                .select('id')
                .eq('user_id', userId)
                .eq('season_id', seasonId)
                .single();

            if (participantError || !participant) {
                console.log('No participant found for user in this season');
                return null;
            }

            // Then get their team selections
            const selections = await databaseService.getParticipantSelections(participant.id);

            // Create a map of team_id -> role for easy lookup
            const teamRoles = new Map<string, string>();
            selections.forEach(selection => {
                teamRoles.set(selection.team_id, selection.role);
            });

            return {
                participantId: participant.id,
                selections: selections,
                teamRoles: teamRoles
            };
        },
        enabled: enabled && !!userId && !!seasonId,
        staleTime: 60000, // 1 minute
    });
}
