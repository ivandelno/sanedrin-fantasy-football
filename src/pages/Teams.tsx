import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActiveSeason } from '../hooks/useSeason';
import { databaseService } from '../services/database.service';
import { Role, League } from '../types/database.types';
import type { ParticipantTeamSummary } from '../types/database.types';
import { FaTrophy, FaFutbol, FaShieldAlt } from 'react-icons/fa';
import { useAuthStore } from '../stores/auth.store';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface GroupedParticipant {
    participantId: string;
    userId: string;
    username: string;
    totalPoints: number;
    teams: ParticipantTeamSummary[];
}

export default function TeamsPage() {
    const { data: season } = useActiveSeason();
    const { user } = useAuthStore();

    const { data: participantsSummary, isLoading, error } = useQuery({
        queryKey: ['participants-teams-summary', season?.id],
        queryFn: () => season ? databaseService.getParticipantsTeamsSummary(season.id) : Promise.resolve([]),
        enabled: !!season
    });

    const groupedParticipants = useMemo(() => {
        if (!participantsSummary) return [];

        const groups = new Map<string, GroupedParticipant>();

        participantsSummary.forEach(item => {
            if (item.last_change_date) {
                console.log(`DEBUG: Team ${item.team_name} has change date:`, item.last_change_date);
            }
            if (!groups.has(item.participant_id)) {
                groups.set(item.participant_id, {
                    participantId: item.participant_id,
                    userId: item.user_id,
                    username: item.username,
                    totalPoints: item.total_season_points,
                    teams: []
                });
            }
            groups.get(item.participant_id)?.teams.push(item);
        });

        console.log('DEBUG: Current User ID:', user?.id);
        groups.forEach(g => console.log(`DEBUG: Participant ${g.username} User ID:`, g.userId));

        // Convert to array and sort: Logged-in user first, then by total points descending
        return Array.from(groups.values()).sort((a, b) => {
            if (user && a.userId === user.id) return -1;
            if (user && b.userId === user.id) return 1;
            return b.totalPoints - a.totalPoints;
        });
    }, [participantsSummary, user]);

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

    const renderLeagueIcon = (league: string, isSuplente: boolean) => {
        const style = {
            fontSize: '1.2em',
            opacity: isSuplente ? 0.5 : 1,
            filter: isSuplente ? 'grayscale(100%)' : 'none'
        };

        switch (league) {
            case League.CHAMPIONS:
                return <FaTrophy title={isSuplente ? "Champions League (Suplente)" : "Champions League"} style={{ ...style, color: '#f59e0b' }} />;
            case League.PRIMERA:
                return <FaFutbol title={isSuplente ? "Primera División (Suplente)" : "Primera División"} style={{ ...style, color: '#3b82f6' }} />;
            case League.SEGUNDA:
                return <FaShieldAlt title={isSuplente ? "Segunda División (Suplente)" : "Segunda División"} style={{ ...style, color: '#6b7280' }} />;
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
                            <h3 style={{ margin: 0 }}>
                                {participant.username}
                                {user && participant.userId === user.id && <span className="text-xs text-primary ml-2">(Tú)</span>}
                            </h3>
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
                                    {participant.teams.map(team => {
                                        const isSuplente = team.role.includes('SUPLENTE');
                                        return (
                                            <tr key={team.team_id}>
                                                <td style={{ textAlign: 'center' }}>
                                                    {renderLeagueIcon(team.league, isSuplente)}
                                                </td>
                                                <td style={getRoleStyle(team.role as Role)}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <span>
                                                            {team.team_name}
                                                            {isSuplente && <span className="text-xs text-secondary ml-2">(Suplente)</span>}
                                                        </span>
                                                        {team.last_change_date && (
                                                            <span className="text-xs text-secondary" title={`Cambio realizado el ${format(new Date(team.last_change_date), "d MMM yyyy HH:mm", { locale: es })}`}>
                                                                {format(new Date(team.last_change_date), "d MMM", { locale: es })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'right', ...getPointsStyle(team.team_points) }}>
                                                    {team.team_points}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
