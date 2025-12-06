import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/Home';
import ClassificationPage from './pages/Classification';
import MatchesPage from './pages/Matches';
import TeamsPage from './pages/Teams';
import TeamManagementPage from './pages/TeamManagement';
import AdminPage from './pages/Admin';
import Layout from './components/layout/Layout';

function App() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/classification" element={<ClassificationPage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/team-management" element={<TeamManagementPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
