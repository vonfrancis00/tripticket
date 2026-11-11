import { normalizeRole, roleLabel } from '../lib/roles';
import { useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import { Plus, Pencil, Users as UsersIcon, X } from 'lucide-react';
const emptyForm = { name: '', email: '', password: '', role: 'driver', office: '' };
const offices = [
  'Office of Chairperson Shirley C. Agrupis',
  'Office of Commissioner Desiderio R. Apag III',
  'Office of Commissioner Ricmar P. Aquino',
  'Office of Commissioner Myrna Q. Mallari',
  'Office of Commissioner Michelle A. Ong',
];
export default function Users() {
  const dialogRef = useRef(null);
  const [items, setItems] = useState([]),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false),
    [editingId, setEditingId] = useState(null),
    [error, setError] = useState(''),
    [form, setForm] = useState({
      name: '',
      email: '',
      password: '',
      role: 'driver',
      office: '',
    });
  const load = () =>
    api
      .get('/users')
      .then((r) => setItems(r.data.users))
      .catch((e) =>
        setError(e.response?.data?.message || 'Unable to load users.'),
      );
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (!show) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [show]);
  const closeForm = () => {
    setShow(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setError('');
  };
  const edit = (user) => {
    setError('');
    setEditingId(user._id);
    setForm({ name: user.name, email: user.email, password: '', role: normalizeRole(user.role), office: user.office || '' });
    setShow(true);
  };
  const save = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (editingId) await api.put(`/users/${editingId}`, form);
      else await api.post('/users', form);
      setEditingId(null);
      setShow(false);
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'driver',
        office: '',
      });
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to save user.');
    } finally { setBusy(false); }
  };
  return (
    <div className="stack-lg">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACCESS CONTROL</span>
          <h1>Users & Drivers</h1>
          <p>Manage accounts and system roles.</p>
        </div>
        <button className="btn primary" disabled={busy} onClick={() => { closeForm(); setShow(true); }}>
          <Plus size={17} /> Add User
        </button>
      </div>
      {error && !show && <div className="alert error" role="alert">{error}</div>}
      {show && (
        <dialog ref={dialogRef} className="app-dialog vehicle-dialog" aria-labelledby="user-dialog-title"
          onCancel={(event) => { event.preventDefault(); if (!busy) closeForm(); }}>
        <div className="vehicle-dialog-header">
          <h2 id="user-dialog-title">{editingId ? 'Edit User' : 'Add User'}</h2>
          <button type="button" className="app-dialog-close" disabled={busy} aria-label="Close user form" onClick={closeForm}><X size={20} /></button>
        </div>
        <form className="form-grid" onSubmit={save}>
          {error && <div className="alert error vehicle-dialog-error" role="alert">{error}</div>}
          <label>
            Full Name
            <input
              autoFocus
              disabled={busy}
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              disabled={busy}
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
            />
          </label>
          <label>
            {editingId ? 'New Password (leave blank to keep current)' : 'Temporary Password'}
            <input
              required={!editingId}
              autoComplete="new-password"
              minLength="8"
              type="password"
              disabled={busy}
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
            />
          </label>
          <label>
            Office
            <select
              disabled={busy}
              value={form.office}
              onChange={(e) =>
                setForm((p) => ({ ...p, office: e.target.value }))
              }
            >
              <option value="">Select office</option>
              {offices.map((office) => (
                <option key={office} value={office}>
                  {office}
                </option>
              ))}
            </select>
          </label>
          <label>
            Role
            <select
              disabled={busy}
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            >
              <option value="driver">Driver</option>
              <option value="admin_officer">Admin Officer</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <div className="vehicle-actions vehicle-dialog-actions">
            <button type="button" className="btn secondary" disabled={busy} onClick={closeForm}>Cancel</button>
            <button className="btn primary" disabled={busy}>{busy ? 'Saving...' : editingId ? 'Save changes' : 'Create account'}</button>
          </div>
        </form>
        </dialog>
      )}
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>System Accounts</h3>
            <p>{items.length} user(s)</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="mobile-records">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Office</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u._id}>
                  <td data-label="Name">
                    <b>{u.name}</b>
                  </td>
                  <td data-label="Email">{u.email}</td>
                  <td data-label="Office">{u.office || '?'}</td>
                  <td data-label="Role">{roleLabel(u.role)}</td>
                  <td data-label="Status">
                    <span
                      className={`status ${u.active ? 'status-approved' : 'status-rejected'}`}
                    >
                      {u.active ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td data-label="Actions"><button type="button" className="btn secondary" disabled={busy} aria-label={`Edit ${u.name}`} onClick={() => edit(u)}><Pencil size={15} /> Edit</button></td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan="6" className="empty">
                    <UsersIcon /> No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
