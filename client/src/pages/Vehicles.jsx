import { useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import { showDialog } from '../lib/dialog';
import { Plus, CarFront, Pencil, Trash2, Wrench, X } from 'lucide-react';
const emptyForm = { make: '', model: '', plateNumber: '', year: '', status: 'active' };
export default function Vehicles() {
  const dialogRef = useRef(null);
  const [items, setItems] = useState([]),
    [form, setForm] = useState({
      make: '',
      model: '',
      plateNumber: '',
      year: '',
      status: 'active',
    }),
    [show, setShow] = useState(false),
    [editingId, setEditingId] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const load = () =>
    api.get('/vehicles').then((r) => setItems(r.data.vehicles)).catch((e) =>
      setError(e.response?.data?.message || 'Unable to load vehicles.'),
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
  };
  const edit = (vehicle) => {
    setError('');
    setEditingId(vehicle._id);
    setForm(Object.fromEntries(Object.keys(emptyForm).map((key) => [key, vehicle[key] ?? emptyForm[key]])));
    setShow(true);
  };
  const remove = async (vehicle) => {
    await showDialog({
      message: `Remove ${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})? Existing trip ticket details will be preserved.`,
      confirm: true,
      confirmLabel: 'Remove vehicle',
      loadingLabel: 'Removing vehicle...',
      onConfirm: async () => {
        setBusy(true);
        setError('');
        try {
          await api.delete(`/vehicles/${vehicle._id}`);
          setItems((current) => current.filter((item) => item._id !== vehicle._id));
          if (editingId === vehicle._id) closeForm();
        } catch (e) {
          throw new Error(e.response?.data?.message || 'Unable to remove vehicle. Please try again.');
        } finally { setBusy(false); }
      },
    });
  };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = { ...form, make: form.make.trim(), model: form.model.trim(), plateNumber: form.plateNumber.trim() };
      if (editingId) await api.put(`/vehicles/${editingId}`, data);
      else await api.post('/vehicles', data);
      setEditingId(null);
      setShow(false);
      setForm({
        make: '',
        model: '',
        plateNumber: '',
        year: '',
        status: 'active',
      });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to save vehicle.');
    } finally { setBusy(false); }
  };
  return (
    <div className="stack-lg">
      <div className="page-heading">
        <div>
          <span className="eyebrow">FLEET</span>
          <h1>Government Vehicles</h1>
          <p>Maintain the vehicle and plate number directory.</p>
        </div>
          <button className="btn primary" disabled={busy} onClick={() => { closeForm(); setError(''); setShow(true); }}>
            <Plus size={17} /> Add Vehicle
          </button>
      </div>
      {error && !show && <div className="alert error" role="alert">{error}</div>}
      {show && (
        <dialog ref={dialogRef} className="app-dialog vehicle-dialog" aria-labelledby="vehicle-dialog-title"
          onCancel={(event) => { event.preventDefault(); if (!busy) closeForm(); }}>
        <div className="vehicle-dialog-header">
          <h2 id="vehicle-dialog-title">{editingId ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
          <button type="button" className="app-dialog-close" disabled={busy} aria-label="Close vehicle form" onClick={closeForm}><X size={20} /></button>
        </div>
        <form className="form-grid" onSubmit={save}>
          {error && <div className="alert error vehicle-dialog-error" role="alert">{error}</div>}
          {['make', 'model', 'plateNumber', 'year'].map((k) => (
            <label key={k}>
              {
                {
                  make: 'Make',
                  model: 'Model',
                  plateNumber: 'Plate number',
                  year: 'Year',
                }[k]
              }
              <input
                autoFocus={k === 'make'}
                required={k !== 'year'}
                disabled={busy}
                value={form[k]}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [k]: e.target.value }))
                }
              />
            </label>
          ))}
          <label>
            Status
            <select disabled={busy} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <div className="vehicle-actions vehicle-dialog-actions">
            <button className="btn primary" disabled={busy}>{busy ? 'Saving...' : editingId ? 'Save changes' : 'Save vehicle'}</button>
            <button type="button" className="btn secondary" disabled={busy} onClick={closeForm}>Cancel</button>
          </div>
        </form>
        </dialog>
      )}
      <div className="vehicle-grid">
        {items.map((v) => (
          <div className="vehicle-card" key={v._id}>
            <div className={`vehicle-icon${v.status === 'maintenance' ? ' vehicle-icon-maintenance' : ''}`}>
              {v.status === 'maintenance' ? <Wrench aria-hidden="true" /> : <CarFront />}
            </div>
            <span
              className={`status status-${v.status === 'maintenance' ? 'maintenance' : v.status === 'active' ? 'approved' : 'rejected'}`}
            >
              {v.status}
            </span>
            <h3>
              {v.make} {v.model}
            </h3>
            <b>{v.plateNumber}</b>
            <small>{v.year || 'Year not specified'}</small>
            <div className="vehicle-actions">
              <button type="button" className="btn secondary" disabled={busy} onClick={() => edit(v)} aria-label={`Edit vehicle ${v.plateNumber}`}>
                <Pencil size={15} /> Edit
              </button>
              <button type="button" className="btn danger" disabled={busy} onClick={() => remove(v)} aria-label={`Remove vehicle ${v.plateNumber}`}>
                <Trash2 size={15} /> Remove
              </button>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="panel empty">No vehicles registered.</div>
        )}
      </div>
    </div>
  );
}
