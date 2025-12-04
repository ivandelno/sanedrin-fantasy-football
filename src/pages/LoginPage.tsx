import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../stores/auth.store';
import './LoginPage.css';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, isLoading } = useAuthStore();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Por favor, introduce usuario y contraseña');
            return;
        }

        try {
            await login(username, password);
        } catch (err) {
            setError('Usuario o contraseña incorrectos');
        }
    };

    return (
        <div className="login-page">
            <div className="login-background"></div>
            <div className="login-container glass">
                <div className="login-header">
                    <h1>⚽ Porra del Sanedrín</h1>
                    <p>Bienvenido a tu liga de apuestas</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="username">Usuario</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Introduce tu usuario"
                            disabled={isLoading}
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Introduce tu contraseña"
                            disabled={isLoading}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="login-footer">
                    <p className="text-sm text-secondary">
                        Si has olvidado tu contraseña, contacta con el administrador
                    </p>
                </div>
            </div>
        </div>
    );
}
