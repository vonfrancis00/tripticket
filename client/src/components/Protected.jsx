import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading)
    return <div className="loading-screen">Loading your workspace…</div>;
  if (!user) return <Navigate to="/request" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
