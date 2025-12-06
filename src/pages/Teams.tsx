import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActiveSeason } from '../hooks/useSeason';
import { databaseService } from '../services/database.service';
import { ParticipantTeamSummary, Role } from '../types/database.types';

interface GroupedParticipant {
    participantId: string;
    username: string;
    totalPoints: number;
    teams: ParticipantTeamSummary[];
}

export default function TeamsPage() {
    const { data: season } = useActiveSeason();

    const { data: participantsSummary, isLoading } = useQuery({
        queryKey: ['participants-teams-summary', season?.id],
        queryFn: () => season ? databaseService.getParticipantsTeamsSummary(season.id) : Promise.resolve([]),
        enabled: !!season
    });

    const groupedParticipants = useMemo(() => {
        if (!participantsSummary) return [];

        const groups = new Map<string, GroupedParticipant>();

        participantsSummary.forEach(item => {
            if (!groups.has(item.participant_id)) {
                groups.set(item.participant_id, {
                    participantId: item.participant_id,
                    username: item.username,
                    totalPoints: item.total_season_points,
                    teams: []
                });
            }
            groups.get(item.participant_id)?.teams.push(item);
        });

        // Convert to array and sort by total points descending
        return Array.from(groups.values()).sort((a, b) => b.totalPoints - a.totalPoints);
    }, [participantsSummary]);

    const getRoleStyle = (role: Role) => {
        if (role === Role.SUMAR || role === 'SUPLENTE_SUMAR') {
            return { color: 'var(--color-success-600)', fontWeight: 'bold' };
        } else if (role === Role.RESTAR || role === 'SUPLENTE_RESTAR') {
            return { color: 'var(--color-danger-600)', fontWeight: 'bold' };
        }
        return { color: 'var(--color-text-secondary)' };
    };

    if (!season) {
        return (
            <div className="page">
                <div className="page-header">
                    <h2>Equipos</h2>
                </div>
                <div className="card">
                    <p className="text-secondary">No hay temporada activa.</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="page">
                <div className="page-header">
                    <h2>Equipos</h2>
                </div>
                <div className="card">
                    <p className="text-secondary">Cargando equipos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <h2>Equipos de Participantes</h2>
                <p className="text-secondary">Temporada {season.name}</p>
            </div>

            <div className="teams-grid">
                {groupedParticipants.map(participant => (
                    <div key={participant.participantId} className="card mb-4">
                        <div className="participant-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem',
                            borderBottom: '1px solid var(--color-border)',
                            paddingBottom: '0.5rem'
                        }}>
                            <h3 style={{ margin: 0 }}>{participant.username}</h3>
                            <div className="participant-points" style={{
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                color: 'var(--color-primary-600)'
                            }}>
                                {participant.totalPoints} pts
                            </div>
                        </div>

                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Liga</th>
                                        <th>Equipo</th>
                                        <th style={{ textAlign: 'right' }}>Puntos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participant.teams.map(team => (
                                        <tr key={team.team_id}>
                                            <td>
                                                <span className="text-xs text-secondary">{team.league}</span>
                                            </td>
                                            <td style={getRoleStyle(team.role as Role)}>
                                                {team.team_name}
                                                {team.role.includes('SUPLENTE') && <span className="text-xs text-secondary ml-2">(Suplente)</span>}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                                {team.team_points}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
