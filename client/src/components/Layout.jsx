import { roleLabel } from '../lib/roles';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus2,
  CalendarDays,
  ClipboardList,
  CarFront,
  Users,
  BarChart3,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
const links = [
  ['/dashboard', 'Overview', LayoutDashboard],
  ['/tickets/new', 'Create Trip Ticket', FilePlus2],
  ['/tickets/multiple-dates', 'Create Multiple Date Trips', CalendarDays],
  ['/tickets', 'Trip Ticket Records', ClipboardList],
  ['/vehicles', 'Vehicles', CarFront],
  ['/users', 'Users & Drivers', Users],
  ['/reports', 'Reports', BarChart3],
];
export default function Layout() {
  const { user, logout } = useAuth();
  const office = user?.office?.trim() || 'No office assigned';
  const commissionerOffice = office.match(/^(Office of Commissioner)\s+(.+)$/i);
  const signOut = () => {
    logout();
  };
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        menuRef.current?.focus();
      }
    };
    const breakpoint = window.matchMedia('(min-width: 961px)');
    const closeOnDesktop = () => { if (breakpoint.matches) setOpen(false); };
    breakpoint.addEventListener('change', closeOnDesktop);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      breakpoint.removeEventListener('change', closeOnDesktop);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);
  return (
    <div className="app-shell">
      <aside id="main-navigation" aria-label="Main navigation" className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <img
            className="brand-mark"
            src={`${import.meta.env.BASE_URL}ched-logo.png`}
            alt="CHED logo"
            width="43"
            height="43"
          />
          <div>
            <b>TRIP TICKET</b>
            <small>Management System</small>
          </div>
          <button ref={closeRef} aria-label="Close navigation" className="mobile-close" onClick={() => { setOpen(false); menuRef.current?.focus(); }}>
            <X size={18} />
          </button>
        </div>
        <div className="office-label" style={{ textTransform: 'uppercase' }}>
          {commissionerOffice ? (
            <>{commissionerOffice[1]}<br />{commissionerOffice[2]}</>
          ) : office}
        </div>
        <nav>
          {links.filter(([to]) => {
            if (to === '/users') return user?.role === 'admin';
            if (['/vehicles', '/reports'].includes(to)) return ['admin', 'admin_officer'].includes(user?.role);
            return true;
          }).map(([to, label, Icon]) => (
            <NavLink
              end={to === '/'}
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={18} />
              <span>{to === '/tickets' && user?.role === 'driver' ? 'My Trips' : label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-link logout" onClick={signOut}>Sign Out</button>
          <div className="secure-note">
            <ShieldCheck size={16} />
            <span>Official Trip Ticket Records</span>
          </div>

        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button ref={menuRef} aria-label="Open navigation" aria-controls="main-navigation" aria-expanded={open} className="menu-btn" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div>
            <span className="eyebrow">COMMISSION ON HIGHER EDUCATION</span>
            <h2>Trip Ticket Management</h2>
          </div>
          <div className="profile"><div><b>{user?.name}</b><small>{roleLabel(user?.role)}</small></div></div>
        </header>
        <section className="page-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
