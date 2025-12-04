import { useAuthStore } from '../stores/auth.store';
import { useActiveSeason } from '../hooks/useSeason';
import { useUserPosition } from '../hooks/useStandings';
import { FaTrophy, FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';

export default function HomePage() {
    const { user } = useAuthStore();
    const { data: season } = useActiveSeason();
    const { position, points, positionChange, isLoading } = useUserPosition(
        season?.id || 0,
        user?.id || 0
    );

    if (!season) {
        return (
            <div className="page">
                <div className="page-header">
                    <h2>Inicio</h2>
                </div>
                <div className="card">
                    <p className="text-secondary">
                        No hay ninguna temporada activa. Contacta con el administrador.
                    </p>
                </div>
            </div>
        );
    }

    const getPositionChangeIcon = () => {
        if (positionChange > 0) return <FaArrowUp className="text-success" />;
        if (positionChange < 0) return <FaArrowDown className="text-danger" />;
        return <FaMinus className="text-secondary" />;
    };

    const getPositionChangeText = () => {
        if (positionChange > 0) return `↑ ${positionChange}`;
        if (positionChange < 0) return `↓ ${Math.abs(positionChange)}`;
        return '-';
    };

    return (
        <div className="page">
            <div className="page-header">
                <h2>¡Bienvenido, {user?.username}!</h2>
                <p className="text-secondary">Temporada: {season.name}</p>
            </div>

            <div className="grid gap-6">
                <div className="card">
                    <h3 className="flex items-center gap-2">
                        <FaTrophy className="text-warning-500" />
                        Tu Clasificación
                    </h3>

                    {isLoading ? (
                        <p className="text-secondary">Cargando...</p>
                    ) : (
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-value">{position}º</div>
                                <div className="stat-label">Posición</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{points}</div>
                                <div className="stat-label">Puntos</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value flex items-center justify-center gap-2">
                                    {getPositionChangeIcon()}
                                    {getPositionChangeText()}
                                </div>
                                <div className="stat-label">Cambio</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="card">
                    <h3>Próxima Jornada</h3>
                    <p className="text-secondary">
                        Los partidos de la próxima jornada se mostrarán en la pestaña "Partidos"
                    </p>
                </div>

                <div className="card">
                    <h3>Noticias</h3>
                    <p className="text-secondary">
                        No hay noticias recientes. El administrador puede publicar noticias desde el panel de administración.
                    </p>
                </div>

                <div className="card">
                    <h3>Estadísticas Rápidas</h3>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="stat-card">
                            <div className="stat-label">Temporada</div>
                            <div className="stat-value text-lg">{season.name}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Estado</div>
                            <div className="stat-value text-lg">
                                {season.is_active ? '🟢 Activa' : '🔴 Inactiva'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
