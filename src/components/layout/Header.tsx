import { useAuthStore } from '../../stores/auth.store';
import './Header.css';

export default function Header() {
    const { user, logout } = useAuthStore();

    return (
        <header className="header">
            <div className="header-content">
                <div className="header-left">
                    <h1 className="header-title">⚽ Porra del Sanedrín</h1>
                    <span className="header-season">Temporada 2024/25</span>
                </div>

                <div className="header-right">
                    <div className="user-info">
                        <span className="user-name">{user?.username}</span>
                        {user?.is_admin && (
                            <span className="admin-badge">Admin</span>
                        )}
                    </div>
                    <button onClick={logout} className="btn-logout">
                        Salir
                    </button>
                </div>
            </div>
        </header>
    );
}
