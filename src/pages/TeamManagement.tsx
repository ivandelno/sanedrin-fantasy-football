export default function TeamManagementPage() {
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
                <form className="password-form">
                    <div className="form-group">
                        <label>Contraseña Actual</label>
                        <input type="password" placeholder="Introduce tu contraseña actual" />
                    </div>
                    <div className="form-group">
                        <label>Nueva Contraseña</label>
                        <input type="password" placeholder="Introduce tu nueva contraseña" />
                    </div>
                    <div className="form-group">
                        <label>Confirmar Contraseña</label>
                        <input type="password" placeholder="Confirma tu nueva contraseña" />
                    </div>
                    <button type="submit" className="btn btn-primary">
                        Cambiar Contraseña
                    </button>
                </form>
            </div>
        </div>
    );
}
