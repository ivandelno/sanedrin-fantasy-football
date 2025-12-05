import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { authService } from '../services/auth.service';

export default function TeamManagementPage() {
    const { user } = useAuthStore();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handlePasswordChange = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validations
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Por favor, completa todos los campos');
            return;
        }

        if (newPassword.length < 6) {
            setError('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (!user?.id) {
            setError('Usuario no encontrado');
            return;
        }

        setIsLoading(true);

        try {
            await authService.changePassword(user.id, currentPassword, newPassword);
            setSuccess('Contraseña cambiada correctamente');
            // Clear form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h2>Gestión de Equipos</h2>
                <p className="text-secondary">Selecciona y gestiona tus equipos</p>
            </div>

            <div className="card">
                <h3>Tus Equipos</h3>
                <p className="text-secondary">
                    La funcionalidad de gestión de equipos estará disponible cuando el administrador
                    abra el período de selección.
                </p>
            </div>

            <div className="card mt-6">
                <h3>Cambios Disponibles</h3>
                <p className="text-secondary">
                    Cambios usados: 0/3
                </p>
            </div>

            <div className="card mt-6">
                <h3>Cambiar Contraseña</h3>

                {error && (
                    <div style={{
                        padding: 'var(--spacing-3)',
                        marginBottom: 'var(--spacing-4)',
                        background: 'var(--color-danger-100)',
                        color: 'var(--color-danger-700)',
                        borderRadius: 'var(--radius-base)',
                        border: '1px solid var(--color-danger-300)'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        padding: 'var(--spacing-3)',
                        marginBottom: 'var(--spacing-4)',
                        background: 'var(--color-success-100)',
                        color: 'var(--color-success-700)',
                        borderRadius: 'var(--radius-base)',
                        border: '1px solid var(--color-success-300)'
                    }}>
                        {success}
                    </div>
                )}

                <form className="password-form" onSubmit={handlePasswordChange}>
                    <div className="form-group">
                        <label htmlFor="current-password">Contraseña Actual</label>
                        <input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Introduce tu contraseña actual"
                            disabled={isLoading}
                            autoComplete="current-password"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new-password">Nueva Contraseña</label>
                        <input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Introduce tu nueva contraseña"
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirm-password">Confirmar Contraseña</label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirma tu nueva contraseña"
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
}
