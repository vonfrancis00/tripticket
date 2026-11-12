import TicketPreview from './pages/TicketPreview';
import AppDialog from './components/AppDialog';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import TicketForm from './pages/TicketForm';
import MultipleDateTrips from './pages/MultipleDateTrips';
import TicketDetail from './pages/TicketDetail';
import Vehicles from './pages/Vehicles';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Protected from './components/Protected';
import PublicLayout from './components/PublicLayout';
import { useAuth } from './context/AuthContext';
export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading your workspace...</div>;
  return (
    <><AppDialog /><Routes>
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/request'} replace />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route element={<PublicLayout />}>
        <Route path="/request" element={user ? <Navigate to="/dashboard" replace /> : <TicketForm publicMode />} />
      </Route>
      <Route
        path="/"
        element={
          <Protected><Layout /></Protected>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="tickets/new" element={<TicketForm />} />
        <Route path="tickets/multiple-dates" element={<MultipleDateTrips />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="tickets/:id/preview" element={<TicketPreview />} />
        <Route path="tickets/:id/edit" element={<TicketForm />} />
        <Route path="vehicles" element={<Protected roles={['admin', 'admin_officer']}><Vehicles /></Protected>} />
        <Route path="users" element={<Protected roles={['admin']}><Users /></Protected>} />
        <Route path="reports" element={<Protected roles={['admin', 'admin_officer']}><Reports /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></>
  );
}
