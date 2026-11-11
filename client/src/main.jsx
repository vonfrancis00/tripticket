import React from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './styles.css';
import './index.css';

// Keep application navigation in memory so every page uses the base URL.
const initialRoute = window.location.pathname + window.location.search + window.location.hash;
window.history.replaceState(null, '', import.meta.env.BASE_URL);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider><App /></AuthProvider>
    </MemoryRouter>
  </React.StrictMode>,
);
