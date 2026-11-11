import { normalizeRole } from '../lib/roles';
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('tt_token');
    if (token)
      api
        .get('/auth/me')
        .then((r) => setUser({ ...r.data.user, role: normalizeRole(r.data.user.role) }))
        .catch(() => localStorage.removeItem('tt_token'))
        .finally(() => setLoading(false));
    else setLoading(false);
  }, []);
  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('tt_token', data.token);
    setUser({ ...data.user, role: normalizeRole(data.user.role) });
  };
  const logout = () => {
    localStorage.removeItem('tt_token');
    setUser(null);
    navigate('/request', { replace: true });
  };
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
