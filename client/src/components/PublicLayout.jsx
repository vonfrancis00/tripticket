import { Link, Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="public-shell">
      <header className="topbar">
        <div className="public-brand">
          <img className="brand-mark" src={`${import.meta.env.BASE_URL}ched-logo.png`} alt="CHED logo" width="43" height="43" />
          <div><span className="eyebrow">COMMISSION ON HIGHER EDUCATION</span><h2>Trip Ticket Management</h2></div>
        </div>
      </header>
      <main className="page-content public-content"><Outlet /></main>
      <footer className="public-footer">
        <span>Office of Commissioner Desiderio R. Apag III</span>
        <Link to="/login" className="staff-access">Staff Access</Link>
      </footer>
    </div>
  );
}
