import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, ArrowUpRight, Plus, MapPin } from 'lucide-react';
import api from '../lib/api';
import { format } from 'date-fns';
const money = (x) => Number(x || 0).toLocaleString();
export default function Dashboard() {
  const { user } = useAuth();
  const allTrips = ['admin', 'admin_officer'].includes(user?.role);
  const [data, setData] = useState({ stats: {}, recent: [] }),
    [err, setErr] = useState('');
  useEffect(() => {
    api
      .get('/dashboard')
      .then((r) => setData(r.data))
      .catch(() => setErr('Dashboard data could not be loaded.'));
  }, []);
  const cards = [['Total Tickets', data.stats.total || 0, FileText, 'blue']];
  return (
    <div className="stack-lg">
      <div className="page-heading">
        <div>
          <span className="eyebrow">WORKSPACE OVERVIEW</span>
          <h1>Good day. Here's your trip activity.</h1>
          <p>Store and manage official travel records.</p>
        </div>
        <Link className="btn primary" to="/tickets/new">
          <Plus size={17} /> New Trip Ticket
        </Link>
      </div>
      {err && <div className="alert error">{err}</div>}
      <div className="stats-grid">
        {cards.map(([label, value, Icon, color]) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${color}`}>
              <Icon size={20} />
            </div>
            <span>{label}</span>
            <strong>{money(value)}</strong>
            <small>{allTrips ? 'All recorded tickets' : 'Your assigned trips'}</small>
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Recent Trip Tickets</h3>
            <p>Latest saved travel records</p>
          </div>
          <Link to="/tickets" className="text-link">
            View all <ArrowUpRight size={15} />
          </Link>
        </div>
        <TicketRows rows={data.recent} />
      </div>
      <div className="info-strip">
        <MapPin size={19} />
        <div>
          <b>Keep travel records complete</b>
          <span>
            Drivers should complete Section B after returning to the office,
            including fuel and speedometer readings.
          </span>
        </div>
      </div>
    </div>
  );
}
export function TicketRows({ rows = [] }) {
  const navigate = useNavigate();
  return (
    <div className="table-wrap">
      <table className="mobile-records">
        <thead>
          <tr>
            <th>Ticket no.</th>
            <th>Travel date</th>
            <th>Driver / Vehicle</th>
            <th>Destination</th>
            <th>Purpose</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((t) => (
              <tr
                key={t._id}
                className="ticket-row"
                tabIndex={0}
                aria-label={`Open trip ${t.ticketNo}`}
                onClick={(event) => {
                  if (event.target.closest('a, button')) return;
                  navigate(`/tickets/${t._id}/preview`);
                }}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/tickets/${t._id}/preview`);
                  }
                }}
              >
                <td data-label="Ticket no.">
                  <Link className="table-id" to={`/tickets/${t._id}/preview`}>
                    {t.ticketNo}
                  </Link>
                </td>
                <td data-label="Travel date">
                  {t.travelDate
                    ? format(new Date(t.travelDate), 'MMM d, yyyy')
                    : '—'}
                </td>
                <td data-label="Driver / Vehicle">
                  <b>{t.driverName}</b>
                  <small className="cell-sub">
                    {t.vehiclePlate || 'Vehicle not assigned'}
                  </small>
                </td>
                <td data-label="Destination">{t.destination || '—'}</td>
                <td data-label="Purpose" className="truncate">{t.purpose || '—'}</td>
                <td data-label="Preview">
                  <Link
                    to={`/tickets/${t._id}/preview`}
                    className="icon-link"
                    aria-label={`Preview trip ${t.ticketNo}`}
                    title="Preview trip"
                  >
                    <ArrowUpRight size={17} />
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="empty">
                No trip tickets found yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
