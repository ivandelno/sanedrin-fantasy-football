import { useState, useMemo, useEffect } from 'react';
import { useActiveSeason } from '../hooks/useSeason';
import { useMatches } from '../hooks/useMatches';
import { useParticipantSelections } from '../hooks/useParticipantSelections';
import { League } from '../types/database.types';
import { format, startOfWeek, endOfWeek, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '../stores/auth.store';
import { footballApiService } from '../services/football-api.service';
import { useQueryClient } from '@tanstack/react-query';

type ViewMode = 'day' | 'week' | 'matchday';

export default function MatchesPage() {
    const [selectedLeague, setSelectedLeague] = useState<'all' | League>('all');
    const [onlyMyTeams, setOnlyMyTeams] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [selectedMatchday, setSelectedMatchday] = useState<number | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ total: number; updated: number; errors: string[] } | null>(null);

    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const { data: season } = useActiveSeason();
    const { data: matches, isLoading } = useMatches({
        seasonId: season?.id || '',
        league: selectedLeague === 'all' ? undefined : selectedLeague,
        enabled: !!season
    });

    // Get user's selected teams
    const { data: participantData } = useParticipantSelections(user?.id, season?.id, !!user && !!season);

    // Extract team IDs and roles from selections for easy lookup
    const userTeamIds = useMemo(() => {
        if (!participantData?.teamRoles) return new Set<string>();
        return new Set(participantData.teamRoles.keys());
    }, [participantData]);

    // Get the role of a team (SUMAR, RESTAR, SUPLENTE)
    const getTeamRole = (teamId: string): string | undefined => {
        return participantData?.teamRoles?.get(teamId);
    };

    // Get color and style for a team based on its role
    const getTeamStyle = (teamId: string) => {
        const role = getTeamRole(teamId);
        if (!role) return { fontWeight: 'normal' as const, color: 'inherit' };

        if (role === 'SUMAR') {
            return {
                fontWeight: 'bold' as const,
                color: 'var(--color-success-600)'
            };
        } else if (role === 'RESTAR') {
            return {
                fontWeight: 'bold' as const,
                color: 'var(--color-danger-600)'
            };
        }

        // SUPLENTE or other roles - normal style
        return { fontWeight: 'normal' as const, color: 'inherit' };
    };

    const handleSync = async () => {
        if (!season || !confirm('¿Estás seguro de que quieres actualizar los partidos desde la API oficial? Esto puede tardar unos segundos.')) return;

        setIsSyncing(true);
        setSyncResult(null);

        try {
            const result = await footballApiService.syncMatches(season.id);
            setSyncResult(result);
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            alert(`Sincronización completada.\\nTotal: ${result.total}\\nActualizados: ${result.updated}\\nErrores: ${result.errors.length}`);
        } catch (error) {
            console.error('Sync error:', error);
            alert('Error al sincronizar partidos. Revisa la consola.');
        } finally {
            setIsSyncing(false);
        }
    };

    // Get available matchdays for selected league
    const availableMatchdays = useMemo(() => {
        if (!matches || selectedLeague === 'all') return [];

        const matchdays = new Set<number>();
        matches
            .filter(match => match.league === selectedLeague)
            .forEach(match => {
                matchdays.add(match.matchday);
            });

        return Array.from(matchdays).sort((a, b) => b - a); // Descending order
    }, [matches, selectedLeague]);

    // Handle league change
    const handleLeagueChange = (league: 'all' | League) => {
        setSelectedLeague(league);
        if (league !== 'all') {
            setViewMode('matchday');
            setSelectedMatchday(null); // Reset to trigger auto-selection in useEffect
        } else {
            setViewMode('day');
            setSelectedMatchday(null);
        }
    };

    // Auto-select the most recent matchday when availableMatchdays updates
    useEffect(() => {
        if (selectedLeague !== 'all' && availableMatchdays.length > 0) {
            // If no matchday is selected, or the selected one is not in the list (e.g. switched leagues)
            if (selectedMatchday === null || !availableMatchdays.includes(selectedMatchday)) {
                setSelectedMatchday(availableMatchdays[0]);
            }
        }
    }, [availableMatchdays, selectedLeague, selectedMatchday]);

    // Filter matches by date range or matchday
    const filteredMatches = useMemo(() => {
        if (!matches) return [];

        let filtered = matches;

        // Filter by date range (day or week)
        if (viewMode === 'day') {
            const today = new Date();
            const dayStart = startOfDay(today);
            const dayEnd = endOfDay(today);

            filtered = filtered.filter(match => {
                const matchDate = new Date(match.utc_datetime);
                return isWithinInterval(matchDate, { start: dayStart, end: dayEnd });
            });
        } else if (viewMode === 'week') {
            const today = new Date();
            // Week from Monday to Monday
            const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
            const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday (but we want next Monday)

            filtered = filtered.filter(match => {
                const matchDate = new Date(match.utc_datetime);
                return isWithinInterval(matchDate, { start: weekStart, end: weekEnd });
            });
        } else if (viewMode === 'matchday' && selectedMatchday !== null) {
            filtered = filtered.filter(match => match.matchday === selectedMatchday);
        }

        // Filter by user teams if checkbox is enabled
        if (onlyMyTeams) {
            filtered = filtered.filter(match =>
                userTeamIds.has(match.home_team_id) || userTeamIds.has(match.away_team_id)
            );
        }

        return filtered;
    }, [matches, viewMode, selectedMatchday, onlyMyTeams, userTeamIds]);

    // Group matches by league and matchday
    const groupedMatches = useMemo(() => {
        const groups: Record<string, typeof filteredMatches> = {};

        filteredMatches.forEach(match => {
            const key = `${match.league}-${match.matchday}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(match);
        });

        // Sort groups: CHAMPIONS first, then PRIMERA, then SEGUNDA
        const leagueOrder = { 'CHAMPIONS': 0, 'PRIMERA': 1, 'SEGUNDA': 2 };
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            const [leagueA, matchdayA] = a.split('-');
            const [leagueB, matchdayB] = b.split('-');

            const leagueCompare = leagueOrder[leagueA as League] - leagueOrder[leagueB as League];
            if (leagueCompare !== 0) return leagueCompare;

            return parseInt(matchdayB) - parseInt(matchdayA); // Descending matchday
        });

        const result: Array<{ league: League; matchday: number; matches: typeof filteredMatches }> = [];
        sortedKeys.forEach(key => {
            const [league, matchday] = key.split('-');
            result.push({
                league: league as League,
                matchday: parseInt(matchday),
                matches: groups[key]
            });
        });

        return result;
    }, [filteredMatches]);

    if (!season) {
        return (
            <div className="page">
                <div className="page-header">
                    <h2>Partidos</h2>
                </div>
                <div className="card">
                    <p className="text-secondary">No hay ninguna temporada activa.</p>
                </div>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { text: string; className: string }> = {
            FINISHED: { text: 'Finalizado', className: 'badge-success' },
            LIVE: { text: 'En Vivo', className: 'badge-danger' },
            SCHEDULED: { text: 'Programado', className: 'badge-neutral' },
            POSTPONED: { text: 'Aplazado', className: 'badge-warning' }
        };

        const badge = badges[status] || badges.SCHEDULED;
        return <span className={`badge ${badge.className}`}>{badge.text}</span>;
    };

    const formatMatchTime = (utcDatetime: string, status: string) => {
        // Don't show status text here, only in badge
        if (status === 'LIVE') {
            return 'EN VIVO';
        }

        try {
            const date = new Date(utcDatetime);
            return format(date, "EEE d MMM, HH:mm", { locale: es });
        } catch {
            return 'Fecha no disponible';
        }
    };

    const getLeagueName = (league: League) => {
        const names: Record<League, string> = {
            PRIMERA: 'PRIMERA',
            SEGUNDA: 'SEGUNDA',
            CHAMPIONS: 'CHAMPIONS'
        };
        return names[league];
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h2>Partidos</h2>
                    <p className="text-secondary">Resultados y próximos encuentros - {season.name}</p>
                </div>
                {user?.is_admin && (
                    <button
                        className="btn btn-primary"
                        onClick={handleSync}
                        disabled={isSyncing}
                    >
                        {isSyncing ? 'Actualizando...' : 'Actualizar Partidos'}
                    </button>
                )}
            </div>

            {syncResult && syncResult.errors.length > 0 && (
                <div className="card mb-4 border-warning">
                    <h4>Advertencias de Sincronización</h4>
                    <ul className="text-sm text-warning">
                        {syncResult.errors.slice(0, 5).map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                        {syncResult.errors.length > 5 && <li>...y {syncResult.errors.length - 5} más</li>}
                    </ul>
                </div>
            )}

            <div className="card mb-4">
                <div className="filters">
                    <div className="filter-group">
                        <button
                            className={selectedLeague === 'all' ? 'filter-btn active' : 'filter-btn'}
                            onClick={() => handleLeagueChange('all')}
                        >
                            Todas
                        </button>
                        <button
                            className={selectedLeague === 'PRIMERA' ? 'filter-btn active' : 'filter-btn'}
                            onClick={() => handleLeagueChange(League.PRIMERA)}
                        >
                            Primera
                        </button>
                        <button
                            className={selectedLeague === 'SEGUNDA' ? 'filter-btn active' : 'filter-btn'}
                            onClick={() => handleLeagueChange(League.SEGUNDA)}
                        >
                            Segunda
                        </button>
                        <button
                            className={selectedLeague === 'CHAMPIONS' ? 'filter-btn active' : 'filter-btn'}
                            onClick={() => handleLeagueChange(League.CHAMPIONS)}
                        >
                            Champions
                        </button>
                    </div>

                    <div className="filter-group">
                        {selectedLeague === 'all' ? (
                            <>
                                <button
                                    className={viewMode === 'day' ? 'filter-btn active' : 'filter-btn'}
                                    onClick={() => setViewMode('day')}
                                >
                                    Día
                                </button>
                                <button
                                    className={viewMode === 'week' ? 'filter-btn active' : 'filter-btn'}
                                    onClick={() => setViewMode('week')}
                                >
                                    Semana
                                </button>
                            </>
                        ) : (
                            <select
                                className="filter-select"
                                value={selectedMatchday || ''}
                                onChange={(e) => setSelectedMatchday(parseInt(e.target.value))}
                                style={{
                                    padding: 'var(--spacing-2) var(--spacing-4)',
                                    border: '2px solid var(--color-border)',
                                    borderRadius: 'var(--radius-base)',
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text-primary)',
                                    fontWeight: 'var(--font-weight-medium)',
                                    fontSize: 'var(--font-size-sm)',
                                    cursor: 'pointer'
                                }}
                            >
                                {availableMatchdays.map(matchday => (
                                    <option key={matchday} value={matchday}>
                                        Jornada {matchday}
                                    </option>
                                ))}
                            </select>
                        )}

                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={onlyMyTeams}
                                onChange={(e) => setOnlyMyTeams(e.target.checked)}
                            />
                            <span>Solo mis equipos</span>
                        </label>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="card">
                    <p className="text-secondary">Cargando partidos...</p>
                </div>
            ) : groupedMatches.length === 0 ? (
                <div className="card">
                    <p className="text-secondary">
                        No hay partidos disponibles para el filtro seleccionado.
                    </p>
                </div>
            ) : (
                groupedMatches.map(group => (
                    <div key={`${group.league}-${group.matchday}`} className="card mb-4">
                        <h3>{getLeagueName(group.league)} - Jornada {group.matchday}</h3>
                        <div className="matches-list">
                            {group.matches.map(match => (
                                <div key={match.id} className="match-item">
                                    <div className="match-time-status">
                                        <div className="match-time">
                                            {formatMatchTime(match.utc_datetime, match.status)}
                                        </div>
                                        {getStatusBadge(match.status)}
                                    </div>

                                    <div className="match-teams">
                                        <span
                                            className="team-name"
                                            style={getTeamStyle(match.home_team_id)}
                                        >
                                            {match.home_team.name}
                                        </span>
                                        {(match.status === 'FINISHED' || match.status === 'LIVE') && match.home_score !== null && match.away_score !== null ? (
                                            <span className={`match-score ${match.status === 'LIVE' ? 'live' : ''}`}>
                                                {match.home_score} - {match.away_score}
                                            </span>
                                        ) : (
                                            <span className="match-vs">vs</span>
                                        )}
                                        <span
                                            className="team-name"
                                            style={getTeamStyle(match.away_team_id)}
                                        >
                                            {match.away_team.name}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
