import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import api from '../lib/api';
import TimeInput from '../components/TimeInput';

const newPoint = (id) => ({ id, from: '', to: '', departureTime: '', arrivalTime: '', departureOdo: '', arrivalOdo: '' });
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function MultipleDateTrips() {
  const [details, setDetails] = useState({ date: today(), driverName: '', vehicleId: '', vehicleName: '', plateNumber: '' });
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(() => [newPoint(1)]);
  const nextPointId = useRef(2);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    if (savingRef.current || saved) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError('');
    try {
      await api.post('/multiple-date-trips', {
        ...details,
        vehicleId: details.vehicleId === 'other' ? null : details.vehicleId,
        points: points.map(({ id, ...point }) => ({
          ...point,
          departureOdo: Number(point.departureOdo),
          arrivalOdo: Number(point.arrivalOdo),
        })),
      });
      setSaved(true);
    } catch (error) {
      setSaveError(error.response?.data?.message || 'Unable to save trip. Please try again.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.allSettled([api.get('/users/drivers'), api.get('/vehicles')]).then(([driverResult, vehicleResult]) => {
      if (!active) return;
      const messages = [];
      if (driverResult.status === 'fulfilled') setDrivers(driverResult.value.data.drivers);
      else messages.push('Unable to load drivers. You can enter the driver name manually.');
      if (vehicleResult.status === 'fulfilled') setVehicles(vehicleResult.value.data.vehicles);
      else messages.push('Unable to load vehicles. Select Other vehicle to enter the details.');
      setErrors(messages);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const setDetail = (key, value) => setDetails((previous) => ({ ...previous, [key]: value }));
  const setPoint = (id, key, value) => setPoints((previous) => previous.map((point) => point.id === id ? { ...point, [key]: value } : point));

  return (
    <div className="stack-lg multiple-date-trips">
      <div className="page-heading">
        <div>
          <h1>Create Multiple Date Trips</h1>
          <p>Enter the travel details, then add each point of the trip.</p>
        </div>
      </div>
      {errors.length > 0 && <div className="alert error" role="alert">{errors.map((message) => <p key={message}>{message}</p>)}</div>}
      {saveError && <div className="alert error" role="alert">{saveError}</div>}
      {saved && <div className="panel" role="status">Trip saved successfully.</div>}
      <form onSubmit={save} className="stack-lg" onChange={() => { setSaved(false); setSaveError(''); }}>
      <fieldset disabled={saving} className="multiple-trip-save-fields stack-lg">
      <section className="panel form-panel" aria-labelledby="trip-details-heading">
        <div className="form-section-title">
          <span>01</span>
          <div><h3 id="trip-details-heading">Date &amp; Vehicle Details</h3><p>Choose the date, driver, and vehicle being used.</p></div>
        </div>
        <div className="form-grid">
          <label className="span-2">Date *
            <input type="date" required value={details.date} onChange={(event) => setDetail('date', event.target.value)} />
          </label>
          <label>Driver Name *
            <input list="multiple-trip-drivers" required value={details.driverName} onChange={(event) => setDetail('driverName', event.target.value)} placeholder={loading ? 'Loading drivers...' : 'Select or enter driver name'} />
            <datalist id="multiple-trip-drivers">{drivers.map((driver) => <option key={driver._id} value={driver.name} />)}</datalist>
          </label>
          <label>Vehicle Being Used *
            <select required value={details.vehicleId} onChange={(event) => {
              const vehicle = vehicles.find((item) => item._id === event.target.value);
              setDetails((previous) => ({ ...previous, vehicleId: event.target.value, vehicleName: vehicle ? `${vehicle.make} ${vehicle.model}` : '', plateNumber: vehicle?.plateNumber || '' }));
            }}>
              <option value="">{loading ? 'Loading vehicles...' : 'Select vehicle'}</option>
              {vehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicle.make} {vehicle.model} - {vehicle.plateNumber}</option>)}
              <option value="other">Other vehicle</option>
            </select>
          </label>
          {details.vehicleId === 'other' && <label>Vehicle Name / Model *
            <input required value={details.vehicleName} onChange={(event) => setDetail('vehicleName', event.target.value)} placeholder="Enter vehicle name or model" />
          </label>}
          <label>Plate Number *
            <input required value={details.plateNumber} onChange={(event) => setDetail('plateNumber', event.target.value)} placeholder="Enter plate number" />
          </label>
        </div>
      </section>
      <section className="panel form-panel stack-lg" aria-labelledby="trip-points-heading">
        <div className="form-section-title">
          <span>02</span>
          <div><h3 id="trip-points-heading">Trips</h3><p>Add the route, travel times, and odometer readings for each point.</p></div>
        </div>
        {points.map((point, index) => (
          <fieldset className="trip-point" key={point.id}>
            <legend>Point {index + 1}</legend>
            <div className="form-grid">
              <label>From *
                <input required value={point.from} onChange={(event) => setPoint(point.id, 'from', event.target.value)} placeholder="Departure location" />
              </label>
              <label>To *
                <input required value={point.to} onChange={(event) => setPoint(point.id, 'to', event.target.value)} placeholder="Arrival location" />
              </label>
              <label>Departure Time *
                <TimeInput label={`Point ${index + 1} departure time`} required value={point.departureTime} onChange={(value) => setPoint(point.id, 'departureTime', value)} />
              </label>
              <label>Arrival Time *
                <TimeInput label={`Point ${index + 1} arrival time`} required value={point.arrivalTime} onChange={(value) => setPoint(point.id, 'arrivalTime', value)} />
              </label>
              <label>Departure Odometer (km) *
                <input type="number" min="0" step="any" required value={point.departureOdo} onChange={(event) => setPoint(point.id, 'departureOdo', event.target.value)} placeholder="Odometer at departure" />
              </label>
              <label>Arrival Odometer (km) *
                <input type="number" min={point.departureOdo === '' ? 0 : point.departureOdo} step="any" required value={point.arrivalOdo} onChange={(event) => setPoint(point.id, 'arrivalOdo', event.target.value)} placeholder="Odometer at arrival" aria-describedby={point.arrivalOdo !== '' && point.departureOdo !== '' && Number(point.arrivalOdo) < Number(point.departureOdo) ? `odo-error-${point.id}` : undefined} />
              </label>
              {point.arrivalOdo !== '' && point.departureOdo !== '' && Number(point.arrivalOdo) < Number(point.departureOdo) && <p className="alert error span-2" id={`odo-error-${point.id}`} role="alert">Arrival odometer must be at least the departure odometer.</p>}
            </div>
            {points.length > 1 && <button type="button" className="btn secondary trip-point-remove" onClick={() => { setSaved(false); setPoints((previous) => previous.filter((item) => item.id !== point.id)); }} aria-label={`Remove point ${index + 1}`}><Trash2 size={16} /> Remove Point</button>}
          </fieldset>
        ))}
        <div><button type="button" className="btn secondary" onClick={() => {
          setSaved(false);
          const id = nextPointId.current++;
          setPoints((previous) => [...previous, newPoint(id)]);
        }}><Plus size={17} /> Add Stop</button></div>
      </section>
      <div className="form-actions">
        <button type="submit" className="btn primary" disabled={saving || saved}>
          <Save size={17} /> {saving ? 'Saving...' : saved ? 'Saved' : 'Save Trip'}
        </button>
      </div>
      </fieldset>
      </form>
    </div>
  );
}
