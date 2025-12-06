import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActiveSeason } from '../hooks/useSeason';
import { databaseService } from '../services/database.service';
import { Role, League } from '../types/database.types';
import type { ParticipantTeamSummary } from '../types/database.types';
import { FaTrophy, FaFutbol, FaShieldAlt } from 'react-icons/fa';

interface GroupedParticipant {
    participantId: string;
    username: string;
    totalPoints: number;
    teams: ParticipantTeamSummary[];
}

export default function TeamsPage() {
    const { data: season } = useActiveSeason();

    const { data: participantsSummary, isLoading, error } = useQuery({
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

    if (error) {
        return (
            <div className="page">
                <div className="page-header">
                    <h2>Equipos</h2>
                </div>
                <div className="card border-danger">
                    <h3>Error al cargar equipos</h3>
                    <p className="text-danger">{(error as Error).message}</p>
                    <p>Asegúrate de haber ejecutado el script SQL 'get_participants_teams_summary.sql' en Supabase.</p>
                </div>
            </div>
        );
    }

    const getRoleStyle = (role: Role) => {
        if (role === Role.SUMAR || role === Role.SUPLENTE_SUMAR) {
            return { color: 'var(--color-success-600)', fontWeight: 'bold' };
        } else if (role === Role.RESTAR || role === Role.SUPLENTE_RESTAR) {
            return { color: 'var(--color-danger-600)', fontWeight: 'bold' };
        }
        return { color: 'var(--color-text-secondary)' };
    };

    const getPointsStyle = (points: number) => {
        if (points > 0) return { color: 'var(--color-success-600)', fontWeight: 'bold' };
        if (points < 0) return { color: 'var(--color-danger-600)', fontWeight: 'bold' };
        return { color: 'var(--color-text-secondary)' };
    };

    const renderLeagueIcon = (league: string) => {
        switch (league) {
            case League.CHAMPIONS:
                return <FaTrophy title="Champions League" style={{ color: '#f59e0b', fontSize: '1.2em' }} />;
            case League.PRIMERA:
                return <FaFutbol title="Primera División" style={{ color: '#3b82f6', fontSize: '1.2em' }} />;
            case League.SEGUNDA:
                return <FaShieldAlt title="Segunda División" style={{ color: '#6b7280', fontSize: '1.2em' }} />;
            default:
                return <span className="text-xs text-secondary">{league}</span>;
        }
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
                                        <th style={{ width: '50px', textAlign: 'center' }}>Liga</th>
                                        <th>Equipo</th>
                                        <th style={{ textAlign: 'right' }}>Puntos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participant.teams.map(team => (
                                        <tr key={team.team_id}>
                                            <td style={{ textAlign: 'center' }}>
                                                {renderLeagueIcon(team.league)}
                                            </td>
                                            <td style={getRoleStyle(team.role as Role)}>
                                                {team.team_name}
                                                {team.role.includes('SUPLENTE') && <span className="text-xs text-secondary ml-2">(Suplente)</span>}
                                            </td>
                                            <td style={{ textAlign: 'right', ...getPointsStyle(team.team_points) }}>
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
