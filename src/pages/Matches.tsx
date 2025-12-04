import { useState } from 'react';
import { useActiveSeason } from '../hooks/useSeason';
import { useMatches } from '../hooks/useMatches';
import { League } from '../types/database.types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '../stores/auth.store';
import { footballApiService } from '../services/football-api.service';
import { useQueryClient } from '@tanstack/react-query';

export default function MatchesPage() {
    const [selectedLeague, setSelectedLeague] = useState<'all' | League>('all');
    const [onlyMyTeams, setOnlyMyTeams] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ total: number; updated: number; errors: string[] } | null>(null);

    const { user } = useAuthStore();
    console.log('Current user:', user);
    console.log('Is admin?', user?.is_admin);
    const queryClient = useQueryClient();

    const { data: season } = useActiveSeason();
    const { data: matches, isLoading } = useMatches({
        seasonId: season?.id || '', // Should be string UUID but hook might expect number? Let's check hook later if needed.
        league: selectedLeague === 'all' ? undefined : selectedLeague,
        enabled: !!season
    });

    const handleSync = async () => {
        if (!season || !confirm('¿Estás seguro de que quieres actualizar los partidos desde la API oficial? Esto puede tardar unos segundos.')) return;

        setIsSyncing(true);
        setSyncResult(null);

        try {
            const result = await footballApiService.syncMatches(season.id);
            setSyncResult(result);
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            alert(`Sincronización completada.\nTotal: ${result.total}\nActualizados: ${result.updated}\nErrores: ${result.errors.length}`);
        } catch (error) {
            console.error('Sync error:', error);
            alert('Error al sincronizar partidos. Revisa la consola.');
        } finally {
            setIsSyncing(false);
        }
    };

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
        if (status === 'FINISHED') return 'Finalizado';
        if (status === 'LIVE') return 'EN VIVO';

        try {
            const date = new Date(utcDatetime);
            return format(date, "EEE d MMM, HH:mm", { locale: es });
        } catch {
            return 'Fecha no disponible';
        }
    };

    const getLeagueBadge = (league: League) => {
        const badges: Record<League, { text: string; className: string }> = {
            PRIMERA: { text: 'Primera', className: 'badge-primary' },
            SEGUNDA: { text: 'Segunda', className: 'badge-secondary' },
            CHAMPIONS: { text: 'Champions', className: 'badge-champions' }
        };

        const badge = badges[league];
        return <span className={`badge ${badge.className}`}>{badge.text}</span>;
    };

    // Group matches by matchday
    const matchesByMatchday = matches?.reduce((acc, match) => {
        const key = match.matchday;
        if (!acc[key]) acc[key] = [];
        acc[key].push(match);
        return acc;
    }, {} as Record<number, typeof matches>);

    const matchdays = matchesByMatchday ? Object.keys(matchesByMatchday).sort((a, b) => parseInt(b) - parseInt(a)) : [];

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
                            onClick={() => setSelectedLeague('all')}
                        >
                            Todas
                        </button>
                        <button
                            className={selectedLeague === 'PRIMERA' ? 'filter-btn active' : 'filter-btn'}
                            onClick={() => setSelectedLeague(League.PRIMERA)}
                        >
                            Primera
                        </button>
                        <button
                            className={selectedLeague === 'SEGUNDA' ? 'filter-btn active' : 'filter-btn'}
                            onClick={() => setSelectedLeague(League.SEGUNDA)}
                        >
                            Segunda
                        </button>
                        <button
                            className={selectedLeague === 'CHAMPIONS' ? 'filter-btn active' : 'filter-btn'}
                            onClick={() => setSelectedLeague(League.CHAMPIONS)}
                        >
                            Champions
                        </button>
                    </div>

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

            {isLoading ? (
                <div className="card">
                    <p className="text-secondary">Cargando partidos...</p>
                </div>
            ) : !matches || matches.length === 0 ? (
                <div className="card">
                    <p className="text-secondary">
                        No hay partidos disponibles. El administrador debe sincronizar los partidos desde la API.
                    </p>
                </div>
            ) : (
                matchdays.map(matchday => (
                    <div key={matchday} className="card mb-4">
                        <h3>Jornada {matchday}</h3>
                        <div className="matches-list">
                            {matchesByMatchday![parseInt(matchday)].map(match => (
                                <div key={match.id} className="match-item">
                                    <div className="match-time-status">
                                        <div className="match-time">
                                            {formatMatchTime(match.utc_datetime, match.status)}
                                        </div>
                                        {getStatusBadge(match.status)}
                                    </div>

                                    <div className="match-teams">
                                        <span className="team-name">{match.home_team.name}</span>
                                        {match.status === 'FINISHED' && match.home_score !== null && match.away_score !== null ? (
                                            <span className="match-score">
                                                {match.home_score} - {match.away_score}
                                            </span>
                                        ) : (
                                            <span className="match-vs">vs</span>
                                        )}
                                        <span className="team-name">{match.away_team.name}</span>
                                    </div>

                                    <div className="match-league">
                                        {getLeagueBadge(match.league)}
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
