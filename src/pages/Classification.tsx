import { useActiveSeason } from '../hooks/useSeason';
import { useStandings } from '../hooks/useStandings';
import { useAuthStore } from '../stores/auth.store';
import { FaMedal, FaMinus } from 'react-icons/fa';

export default function ClassificationPage() {
    const { user } = useAuthStore();
    const { data: season } = useActiveSeason();
    const { data: standings, isLoading } = useStandings(season?.id || 0, !!season);

    if (!season) {
        return (
            <div className="page">
                <div className="page-header">
                    <h2>Clasificación</h2>
                </div>
                <div className="card">
                    <p className="text-secondary">
                        No hay ninguna temporada activa.
                    </p>
                </div>
            </div>
        );
    }

    const getMedalIcon = (position: number) => {
        if (position === 1) return <FaMedal className="text-warning-500" title="1º Puesto" />;
        if (position === 2) return <FaMedal className="text-neutral-400" title="2º Puesto" />;
        if (position === 3) return <FaMedal className="text-warning-600" title="3º Puesto" />;
        return null;
    };

    const getPositionChange = (change?: number) => {
        if (!change || change === 0) return <FaMinus className="text-secondary" />;
        if (change > 0) return <span className="text-success">↑ {change}</span>;
        return <span className="text-danger">↓ {Math.abs(change)}</span>;
    };

    return (
        <div className="page">
            <div className="page-header">
                <h2>Clasificación</h2>
                <p className="text-secondary">Ranking de participantes - {season.name}</p>
            </div>

            <div className="card">
                {isLoading ? (
                    <p className="text-secondary">Cargando clasificación...</p>
                ) : !standings || standings.length === 0 ? (
                    <p className="text-secondary">
                        Aún no hay datos de clasificación. Los puntos se calcularán cuando se jueguen los partidos.
                    </p>
                ) : (
                    <div className="table-container">
                        <table className="standings-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}>Pos</th>
                                    <th>Usuario</th>
                                    <th style={{ width: '100px', textAlign: 'right' }}>Puntos</th>
                                    <th style={{ width: '100px', textAlign: 'center' }}>Cambio</th>
                                    <th style={{ width: '100px', textAlign: 'right' }}>Partidos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standings.map((standing) => (
                                    <tr
                                        key={standing.participant_id}
                                        className={standing.user_id === user?.id ? 'highlight-row' : ''}
                                        style={{
                                            backgroundColor: standing.user_id === user?.id ? 'var(--color-primary-50)' : undefined,
                                            fontWeight: standing.user_id === user?.id ? 600 : undefined
                                        }}
                                    >
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {getMedalIcon(standing.position)}
                                                <span>{standing.position}º</span>
                                            </div>
                                        </td>
                                        <td>
                                            {standing.username}
                                            {standing.user_id === user?.id && (
                                                <span className="text-sm text-primary-600 ml-2">(Tú)</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <strong>{standing.total_points}</strong>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {getPositionChange(standing.position_change)}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {standing.matches_played}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="card mt-6">
                <h3>Evolución de Puntos</h3>
                <p className="text-secondary">
                    La gráfica de evolución por jornadas estará disponible próximamente.
                </p>
                <div style={{
                    height: '200px',
                    background: 'var(--color-neutral-50)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 'var(--spacing-4)'
                }}>
                    <p className="text-secondary">Gráfica de evolución (próximamente)</p>
                </div>
            </div>
        </div>
    );
}
