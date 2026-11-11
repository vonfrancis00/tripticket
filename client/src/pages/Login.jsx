import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
export default function Login() {
  const { login } = useAuth(),
    nav = useNavigate(),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login({ email, password });
      nav('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to sign in. Check your credentials.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="login-visual-inner">
          <img
            className="login-logo"
            src={`${import.meta.env.BASE_URL}ched-logo.png`}
            alt="CHED logo"
            width="170"
            height="170"
          />
          <p className="eyebrow light">
            REPUBLIC OF THE PHILIPPINES · COMMISSION ON HIGHER EDUCATION
          </p>
          <h1>
            Official travel.
            <br />
            <em>Accountable Records.</em>
          </h1>
          <p>
            A centralized workspace for preparing, approving, and documenting
            government vehicle trips.
          </p>
          <div className="login-foot">All Rights Reserved.</div>
        </div>
      </div>
      <div className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-icon">
            <ShieldCheck />
          </div>
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Sign in to Your Workspace</h2>
          <p>Use your assigned CHED email and Trip Ticket password.</p>
          {error && <div className="alert error">{error}</div>}
          <label>
            Email Address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <button className="btn primary full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
            <ArrowRight size={17} />
          </button>
          <small className="muted">For Authorized Personnel Only.</small>
          <Link to="/request" className="back-link">Back to Create Trip Ticket</Link>
        </form>
      </div>
    </div>
  );
}
