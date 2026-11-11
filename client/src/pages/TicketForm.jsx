import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import TicketPreview from './TicketPreview';
const empty = {
  travelDate: new Date().toISOString().slice(0, 10),
  driverName: '',
  vehicleId: '',
  vehicleName: '',
  vehiclePlate: '',
  passengerName: '',
  destination: '',
  purpose: '',
  approvedBy: 'Desiderio R. Apag III, PCpE, D.Eng., ASEAN Eng., IntPE',
  report: {},
};
const steps = [
  'Travel Information',
  'Passengers & Authorization',
  "Driver's Report",
];
const num = (value) => Number(value || 0);
export default function TicketForm({ publicMode = false }) {
  const [savedTicket, setSavedTicket] = useState(null);
  const { id } = useParams(),
    nav = useNavigate(),
    [form, setForm] = useState(() => ({
      ...empty,
    })),
    [vehicles, setVehicles] = useState([]),
    [drivers, setDrivers] = useState([]),
    [driversLoading, setDriversLoading] = useState(!id),
    [driversError, setDriversError] = useState(''),
    [otherVehicle, setOtherVehicle] = useState(false),
    [step, setStep] = useState(1),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    if (!id) {
      setDriversLoading(true);
      setDriversError('');
      api.get('/users/drivers')
        .then((r) => setDrivers(r.data.drivers))
        .catch(() => setDriversError('Unable to load drivers. Please refresh to try again.'))
        .finally(() => setDriversLoading(false));
    }
    api
      .get(publicMode ? '/vehicles/options' : '/vehicles')
      .then((r) => setVehicles(r.data.vehicles))
      .catch(() => {});
    if (id)
      api
        .get(`/tickets/${id}`)
        .then((r) => {
          const t = r.data.ticket;
          setOtherVehicle(!t.vehicleId && Boolean(t.vehicleName));
          setForm({
            ...t,
            travelDate: t.travelDate?.slice(0, 10) || '',
            report: {
              ...t.report,
              passengerSignedDate:
                t.report?.passengerSignedDate?.slice(0, 10) || '',
            },
          });
        })
        .catch(() => setError('Unable to load ticket.'));
  }, [id, publicMode]);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    if (step < 3) {
      if (
        step === 2 &&
        form.passengerName.split('\n').some((name) => !name.trim())
      ) {
        setError(
          'Enter a name for each passenger or remove the empty passenger.',
        );
        return;
      }
      setError('');
      setStep(step + 1);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const passengers = form.passengerName
        .split('\n')
        .map((name) => name.trim());
      if (passengers.some((name) => !name))
        throw new Error(
          'Enter a name for each passenger or remove the empty passenger.',
        );
      const payload = {
        ...form,
        vehicleId: otherVehicle ? null : form.vehicleId || null,
        vehicleName: otherVehicle ? form.vehicleName.trim() : '',
        passengerName: passengers.join('\n'),
        report: Object.fromEntries(
          Object.entries(form.report || {}).filter(
            ([key, value]) => value !== '' && value != null,
          ),
        ),
      };
      const r = id
        ? await api.put(`/tickets/${id}`, payload)
        : await api.post('/tickets', payload);
      if (publicMode) setSavedTicket(r.data.ticket);
      else nav(`/tickets/${r.data.ticket._id}`);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Unable to save ticket.',
      );
    } finally {
      setBusy(false);
    }
  };
  const setReport = (key, value) =>
    setForm((previous) => ({
      ...previous,
      report: { ...previous.report, [key]: value },
    }));
  const reportField = (label, key, type) => (
    <label>
      {label}
      <input
        type={type}
        min={type === 'number' ? 0 : undefined}
        step={type === 'number' ? 'any' : undefined}
        value={form.report?.[key] ?? ''}
        onChange={(e) => setReport(key, e.target.value)}
      />
    </label>
  );
  if (savedTicket) return (
    <div className="stack-lg">
    <div className="panel form-panel stack-lg">
      <h1>Trip ticket created</h1>
      <p role="status">Your trip ticket number is <strong>{savedTicket.ticketNo}</strong>. Your travel details have been saved. Review your saved trip below.</p>
      <button className="btn primary" onClick={() => {
        setForm({ ...empty, report: {} });
        setOtherVehicle(false);
        setStep(1);
        setSavedTicket(null);
      }}>Create another trip ticket</button>
    </div>
    <TicketPreview savedTicket={savedTicket} />
    </div>
  );
  return (
    <div className="stack-lg">
      {publicMode && <section className="panel panel-heading" aria-labelledby="my-trips-heading">
        <div>
          <h3 id="my-trips-heading">My Trips</h3>
          <p>Sign in with your assigned CHED email account to view trips matching your driver name.</p>
        </div>
        <Link className="btn primary" to="/login">Sign in to view my trips</Link>
      </section>}
      <div className="page-heading">
        <div>
          {!publicMode && <Link to="/tickets" className="back-link">
            <ArrowLeft size={15} /> Back to Records
          </Link>}
          <span className="eyebrow">SECTION A · ADMINISTRATIVE OFFICIAL</span>
          <h1>{id ? 'Edit trip ticket' : 'Create Trip Ticket'}</h1>
          <p>Enter the official travel details for authorization.</p>
        </div>
      </div>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={submit} className="panel form-panel">
        <nav aria-label="Trip ticket progress" className="ticket-progress">
          <ol>
            {steps.map((title, index) => (
              <li
                key={title}
                className={
                  step === index + 1
                    ? 'active'
                    : step > index + 1
                      ? 'complete'
                      : ''
                }
                aria-current={step === index + 1 ? 'step' : undefined}
              >
                <span className="ticket-step-number">
                  {step > index + 1 ? (
                    <Check size={17} aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                <div>
                  <small>STEP {index + 1}</small>
                  <strong>{title}</strong>
                </div>
              </li>
            ))}
          </ol>
        </nav>
        <div className="form-section-title">
          <span>0{step}</span>
          <div>
            <h3 id="ticket-step-title">{steps[step - 1]}</h3>
            <p aria-live="polite">
              Step {step} of 3:{' '}
              {step === 1
                ? 'Enter the travel date, driver, and vehicle details.'
                : step === 2
                  ? 'Add passengers, destination, and the purpose of travel.'
                  : 'Optional. Complete the report after the trip.'}
            </p>
          </div>
        </div>
        <div
          className="form-grid"
          role="group"
          aria-labelledby="ticket-step-title"
          key={step}
        >
          {step === 1 ? (
            <>
              <label>
                Travel Date *
                <input
                  type="date"
                  value={form.travelDate || ''}
                  onChange={(e) => set('travelDate', e.target.value)}
                  required
                />
              </label>
              <label>
                Driver Name *
                {id ? <input
                  value={form.driverName || ''}
                  onChange={(e) => set('driverName', e.target.value)}
                  placeholder="Full name of driver"
                  required
                /> : <select
                  value={form.driverName || ''}
                  onChange={(e) => set('driverName', e.target.value)}
                  disabled={driversLoading || Boolean(driversError) || drivers.length === 0}
                  required
                >
                  <option value="">{driversLoading ? 'Loading drivers...' : driversError ? 'Unable to load drivers' : drivers.length ? 'Select Driver' : 'No drivers available'}</option>
                  {drivers.map((driver) => (
                    <option key={driver._id} value={driver.name}>{driver.name}</option>
                  ))}
                </select>}
                {!id && driversError && <span role="alert">{driversError}</span>}
              </label>
              <label>
                Government Vehicle / Plate No.
                <select
                  value={otherVehicle ? 'others' : form.vehicleId || ''}
                  onChange={(e) => {
                    setOtherVehicle(e.target.value === 'others');
                    const v = vehicles.find((x) => x._id === e.target.value);
                    set('vehicleId', v?._id || '');
                    set('vehicleName', '');
                    set('vehiclePlate', v?.plateNumber || '');
                  }}
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((v) => (
                    <option value={v._id} key={v._id}>
                      {v.make} {v.model} · {v.plateNumber}
                    </option>
                  ))}
                  <option value="others">Others</option>
                </select>
              </label>
              {otherVehicle && (
                <label>
                  Vehicle Name / Model *
                  <input
                    value={form.vehicleName || ''}
                    onChange={(e) => set('vehicleName', e.target.value)}
                    placeholder="e.g. Toyota Innova"
                    required
                  />
                </label>
              )}
              <label>
                Vehicle Plate Number
                <input
                  value={form.vehiclePlate || ''}
                  onChange={(e) => set('vehiclePlate', e.target.value)}
                  placeholder="e.g. ABC 1234"
                />
              </label>
            </>
          ) : step === 2 ? (
            <>
              <fieldset className="passenger-fields">
                <legend>Authorized passengers *</legend>
                {form.passengerName.split('\n').map((name, index, names) => (
                  <div className="passenger-row" key={index}>
                    <label className="passenger-name">
                      <span>Passenger {index + 1}</span>
                      <input
                        value={name}
                        onChange={(e) =>
                          set(
                            'passengerName',
                            names
                              .map((current, i) =>
                                i === index ? e.target.value : current,
                              )
                              .join('\n'),
                          )
                        }
                        placeholder="Full name of passenger"
                        required
                      />
                    </label>
                    {names.length > 1 && (
                      <button
                        type="button"
                        className="btn secondary"
                        aria-label={`Remove passenger ${index + 1}`}
                        onClick={() =>
                          set(
                            'passengerName',
                            names.filter((_, i) => i !== index).join('\n'),
                          )
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() =>
                    set('passengerName', form.passengerName + '\n')
                  }
                >
                  + Add passenger
                </button>
              </fieldset>
              <label>
                Place(s) to be visited / inspected *
                <textarea
                  rows="2"
                  value={form.destination || ''}
                  onChange={(e) => set('destination', e.target.value)}
                  placeholder="Enter destination(s)"
                  required
                />
              </label>
              <label className="span-2">
                Purpose *
                <textarea
                  rows="3"
                  value={form.purpose || ''}
                  onChange={(e) => set('purpose', e.target.value)}
                  placeholder="State the official purpose of travel"
                  required
                />
              </label>
              <label>
                Approved By
                <input
                  value={form.approvedBy || ''}
                  onChange={(e) => set('approvedBy', e.target.value)}
                  placeholder="Authorizing official"
                />
                <span className="approver-title">Commissioner</span>
              </label>
            </>
          ) : (
            <>
              <div className="subsection-label span-2">Travel times</div>
              {reportField(
                '1. Departure from office / garage',
                'departureTime',
                'time',
              )}
              {reportField('2. Arrival at destination', 'arrivalTime', 'time')}
              {reportField(
                '3. Departure from destination',
                'destinationDepartureTime',
                'time',
              )}
              {reportField(
                '4. Arrival back at office / garage',
                'returnTime',
                'time',
              )}
              {reportField(
                '5. Approximate distance travelled (km)',
                'distanceTravelled',
                'number',
              )}
              <div className="subsection-label span-2">
                Gasoline issued, purchased and consumed (liters)
              </div>
              {reportField('a) Balance in tank', 'fuelBalance', 'number')}
              {reportField(
                'b) Issued by office from stock',
                'fuelIssued',
                'number',
              )}
              {reportField(
                'c) Add-purchased during trip',
                'fuelPurchased',
                'number',
              )}
              <div className="computed-field">
                <small>TOTAL FUEL AVAILABLE</small>
                <b>
                  {num(form.report?.fuelBalance) +
                    num(form.report?.fuelIssued) +
                    num(form.report?.fuelPurchased)}{' '}
                  liters
                </b>
              </div>
              {reportField('d) Used during the trip', 'fuelUsed', 'number')}
              {reportField(
                'e) Balance in tank at end trip',
                'fuelEndingBalance',
                'number',
              )}
              <div className="subsection-label span-2">
                Vehicle supplies and speedometer
              </div>
              {reportField('7. Gear oil used (liters)', 'gearOil', 'number')}
              {reportField(
                '8. Lubricating oil used (liters)',
                'lubricatingOil',
                'number',
              )}
              {reportField('9. Grease issued (liters)', 'grease', 'number')}
              {reportField(
                '10a. Speedometer at beginning (kms)',
                'speedometerStart',
                'number',
              )}
              {reportField(
                '10b. Speedometer at end (kms)',
                'speedometerEnd',
                'number',
              )}
              <div className="computed-field">
                <small>10c. DISTANCE TRAVELLED</small>
                <b>
                  {Math.max(
                    0,
                    num(form.report?.speedometerEnd) -
                      num(form.report?.speedometerStart),
                  )}{' '}
                  kms
                </b>
              </div>
              <label className="span-2">
                11. Remarks
                <textarea
                  rows="3"
                  value={form.report?.remarks || ''}
                  onChange={(e) => setReport('remarks', e.target.value)}
                />
              </label>
              {reportField(
                'Passenger certification date',
                'passengerSignedDate',
                'date',
              )}
              <p className="muted span-2">
                Driver and passenger signatures are signed on the printed copy.
              </p>
            </>
          )}
        </div>
        <div className="form-actions">
          <span className="muted">
            {step < 3
              ? 'Complete all three steps to create your trip ticket.'
              : 'Ticket number is generated automatically when saved.'}
          </span>
          <div className="ticket-step-actions">
            {step > 1 && (
              <button
                type="button"
                className="btn secondary"
                disabled={busy}
                onClick={() => {
                  setError('');
                  setStep(step - 1);
                }}
              >
                <ArrowLeft size={17} /> Back
              </button>
            )}
            <button
              key={step}
              type="submit"
              className="btn primary"
              disabled={busy || (!id && step === 1 && (driversLoading || Boolean(driversError) || drivers.length === 0))}
            >
              {step < 3 ? (
                <>
                  Next <ArrowRight size={17} />
                </>
              ) : (
                <>
                  <Save size={17} />
                  {busy ? 'Saving...' : 'Save Trip Ticket'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
