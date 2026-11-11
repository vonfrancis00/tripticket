import { formatPassengerNames } from '../lib/passengerNames';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Edit3, FileDown } from 'lucide-react';
import api from '../lib/api';
import { makePdf } from '../lib/tripTicketPdf';
export { makePdf } from '../lib/tripTicketPdf';
const val = (x) => x ?? '—';
const num = (x) => Number(x || 0);
export default function TicketDetail() {
  const { id } = useParams(),
    [t, setT] = useState(null),
    [report, setReport] = useState({}),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const load = () =>
    api
      .get(`/tickets/${id}`)
      .then((r) => {
        setT(r.data.ticket);
        setReport(r.data.ticket.report || {});
      })
      .catch(() => setError('Unable to load ticket.'));
  useEffect(() => {
    load();
  }, [id]);
  const saveReport = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put(`/tickets/${id}/report`, report);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to save driver report.');
    } finally {
      setBusy(false);
    }
  };
  if (!t) return <div>{error || 'Loading ticket…'}</div>;
  const requiredReportFields = [
    'departureTime',
    'arrivalTime',
    'destinationDepartureTime',
    'returnTime',
    'speedometerStart',
    'speedometerEnd',
  ];
  const field = (label, key, type = 'text') => (
    <label>
      {label}
      {requiredReportFields.includes(key) ? ' *' : ''}
      <input
        required={requiredReportFields.includes(key)}
        type={type}
        value={report[key] ?? ''}
        onChange={(e) => setReport((p) => ({ ...p, [key]: e.target.value }))}
      />
    </label>
  );
  return (
    <div className="stack-lg">
      <div className="page-heading">
        <div>
          <Link to="/tickets" className="back-link">
            <ArrowLeft size={15} /> Back to records
          </Link>
          <span className="eyebrow">TRIP TICKET · {t.ticketNo}</span>
          <h1>{t.destination}</h1>
          <p>
            {t.ticketNo} ·{' '}
            {t.travelDate ? new Date(t.travelDate).toLocaleDateString() : '—'}
          </p>
        </div>
        <div className="heading-actions">
          <button className="btn secondary" onClick={() => makePdf(t)}>
            <FileDown size={16} /> Export PDF
          </button>
            <Link className="btn secondary" to={`/tickets/${id}/edit`}>
              <Edit3 size={16} /> Edit
            </Link>
        </div>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="panel detail-panel">
        <div className="panel-heading">
          <div>
            <h3>Section A · Administrative official</h3>
            <p>Official travel authorization details</p>
          </div>
        </div>
        <div className="detail-grid">
          {[
            ['Ticket number', t.ticketNo],
            [
              'Travel date',
              t.travelDate ? new Date(t.travelDate).toLocaleDateString() : '—',
            ],
            ['Driver', t.driverName],
            ['Government car / plate', [t.vehicleName, t.vehiclePlate].filter(Boolean).join(' · ')],
            ['Authorized passengers', formatPassengerNames(t.passengerName)],
            ['Destination(s)', t.destination],
            ['Purpose', t.purpose],
            ['Approved by', t.approvedBy],
          ].map(([k, v]) => (
            <div key={k}>
              <small>{k}</small>
              <b>{val(v)}</b>
            </div>
          ))}
        </div>
      </div>
      <form className="panel form-panel" onSubmit={saveReport}>
        <div className="form-section-title">
          <span>02</span>
          <div>
            <h3>Section B · Driver's report</h3>
            <p>
              Complete after the official trip. Fields 1?4, 10a and 10b are
              required (*); all other fields are optional. Total fuel and
              speedometer distance are calculated automatically.
            </p>
          </div>
        </div>
        <div className="form-grid">
          <div className="subsection-label span-2">Travel times</div>
          {field('1. Departure from office / garage', 'departureTime', 'time')}
          {field('2. Arrival at destination', 'arrivalTime', 'time')}
          {field(
            '3. Departure from destination',
            'destinationDepartureTime',
            'time',
          )}
          {field('4. Arrival back at office / garage', 'returnTime', 'time')}
          {field(
            '5. Approximate distance travelled (km)',
            'distanceTravelled',
            'number',
          )}
          <div className="subsection-label span-2">
            Gasoline issued, purchased and consumed (liters)
          </div>
          {field('a) Balance in tank', 'fuelBalance', 'number')}
          {field('b) Issued by office from stock', 'fuelIssued', 'number')}
          {field('c) Add-purchased during trip', 'fuelPurchased', 'number')}
          <div className="computed-field">
            <small>TOTAL FUEL AVAILABLE</small>
            <b>
              {num(report.fuelBalance) +
                num(report.fuelIssued) +
                num(report.fuelPurchased)}{' '}
              liters
            </b>
          </div>
          {field('d) Used during the trip', 'fuelUsed', 'number')}
          {field(
            'e) Balance in tank at end trip',
            'fuelEndingBalance',
            'number',
          )}
          <div className="subsection-label span-2">
            Vehicle supplies and speedometer
          </div>
          {field('7. Gear oil used (liters)', 'gearOil', 'number')}
          {field(
            '8. Lubricating oil used (liters)',
            'lubricatingOil',
            'number',
          )}
          {field('9. Grease issued (liters)', 'grease', 'number')}
          {field(
            '10a. Speedometer at beginning (kms)',
            'speedometerStart',
            'number',
          )}
          {field('10b. Speedometer at end (kms)', 'speedometerEnd', 'number')}
          <div className="computed-field">
            <small>10c. DISTANCE TRAVELLED</small>
            <b>
              {Math.max(
                0,
                num(report.speedometerEnd) - num(report.speedometerStart),
              )}{' '}
              kms
            </b>
          </div>
          <label className="span-2">
            11. Remarks
            <textarea
              rows="3"
              value={report.remarks || ''}
              onChange={(e) =>
                setReport((p) => ({ ...p, remarks: e.target.value }))
              }
            />
          </label>
          <label>
            Passenger certification date
            <input
              type="date"
              value={report.passengerSignedDate || ''}
              onChange={(e) =>
                setReport((p) => ({
                  ...p,
                  passengerSignedDate: e.target.value,
                }))
              }
            />
          </label>
        </div>
        <div className="form-actions">
          <span className="muted">
            Driver and passenger signatures are signed on the printed copy.
          </span>
          <button className="btn primary" disabled={busy}>
            <CheckCircle2 size={17} />
            {busy ? 'Saving…' : 'Save driver report'}
          </button>
        </div>
      </form>
    </div>
  );
}
