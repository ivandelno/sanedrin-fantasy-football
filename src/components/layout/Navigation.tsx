import { NavLink } from 'react-router-dom';
import { FaHome, FaTrophy, FaFutbol, FaCog, FaShieldAlt } from 'react-icons/fa';
import { useAuthStore } from '../../stores/auth.store';
import './Navigation.css';

export default function Navigation() {
    const { user } = useAuthStore();

    return (
        <nav className="navigation">
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <FaHome className="nav-icon" />
                <span>Inicio</span>
            </NavLink>

            <NavLink to="/classification" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <FaTrophy className="nav-icon" />
                <span>Clasificación</span>
            </NavLink>

            <NavLink to="/matches" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <FaFutbol className="nav-icon" />
                <span>Partidos</span>
            </NavLink>

            <NavLink to="/team-management" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <FaCog className="nav-icon" />
                <span>Gestión</span>
            </NavLink>

            {user?.is_admin && (
                <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <FaShieldAlt className="nav-icon" />
                    <span>Admin</span>
                </NavLink>
            )}
        </nav>
    );
}
