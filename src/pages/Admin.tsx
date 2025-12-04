import { useAuthStore } from '../stores/auth.store';
import { Navigate } from 'react-router-dom';

export default function AdminPage() {
    const { user } = useAuthStore();

    if (!user?.is_admin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="page">
            <div className="page-header">
                <h2>Panel de Administración</h2>
                <p className="text-secondary">Gestión de temporadas, usuarios y configuración</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="card">
                    <h3>Temporadas</h3>
                    <p className="text-secondary">Crear y gestionar temporadas</p>
                    <button className="btn btn-primary mt-4">Nueva Temporada</button>
                </div>

                <div className="card">
                    <h3>Usuarios</h3>
                    <p className="text-secondary">Gestionar usuarios y contraseñas</p>
                    <button className="btn btn-primary mt-4">Nuevo Usuario</button>
                </div>

                <div className="card">
                    <h3>Equipos</h3>
                    <p className="text-secondary">Sincronizar equipos desde la API</p>
                    <button className="btn btn-primary mt-4">Sincronizar Equipos</button>
                </div>

                <div className="card">
                    <h3>Noticias</h3>
                    <p className="text-secondary">Publicar noticias y anuncios</p>
                    <button className="btn btn-primary mt-4">Nueva Noticia</button>
                </div>

                <div className="card">
                    <h3>Partidos</h3>
                    <p className="text-secondary">Gestionar resultados de partidos</p>
                    <button className="btn btn-primary mt-4">Ver Partidos</button>
                </div>

                <div className="card">
                    <h3>Configuración</h3>
                    <p className="text-secondary">Ajustes generales de la aplicación</p>
                    <button className="btn btn-primary mt-4">Configurar</button>
                </div>
            </div>
        </div>
    );
}
