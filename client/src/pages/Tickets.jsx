import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import api from '../lib/api';
import { TicketRows } from './Dashboard';
export default function Tickets() {
  const { user } = useAuth();
  const allTrips = ['admin', 'admin_officer'].includes(user?.role);
  const [rows, setRows] = useState([]),
    [q, setQ] = useState(''),
    [error, setError] = useState('');
  const load = () =>
    api
      .get('/tickets', { params: { search: q } })
      .then((r) => setRows(r.data.tickets))
      .catch(() => setError('Could not load records.'));
  useEffect(() => {
    load();
  }, [q]);
  return (
    <div className="stack-lg">
      <div className="page-heading">
        <div>
          <span className="eyebrow">RECORDS</span>
          <h1>{allTrips ? 'Trip Ticket Records' : 'My Trips'}</h1>
          <p>{allTrips ? 'Search saved official travel records.' : 'Only trips matching your account name in the Driver column are shown.'}</p>
        </div>
        <Link className="btn primary" to="/tickets/new">
          <Plus size={17} /> Create Trip Ticket
        </Link>
      </div>
      <div className="toolbar">
        <div className="searchbox">
          <Search size={17} />
          <input
            placeholder="Search ticket, driver, destination…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>{allTrips ? 'All Trip Tickets' : 'My Assigned Trips'}</h3>
            <p>{rows.length} record(s) displayed</p>
          </div>
        </div>
        <TicketRows rows={rows} />
      </div>
    </div>
  );
}
