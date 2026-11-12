import { formatPassengerNames } from '../lib/passengerNames';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileDown, Trash2, X } from 'lucide-react';
import { showDialog } from '../lib/dialog';
import api from '../lib/api';
import { createTripTicketPdf, makePdf } from '../lib/tripTicketPdf';
import PdfPreview from '../components/PdfPreview';

const value = (x) => (x === undefined || x === null || x === '' ? '—' : x);
const date = (x) => (x ? new Date(x).toLocaleDateString() : '—');
const displayTime = (time) => {
  if (!time) return '';
  const [hour, minute] = time.split(':');
  return `${Number(hour) % 12 || 12}:${minute} ${Number(hour) >= 12 ? 'PM' : 'AM'}`;
};
const quantity = (x, unit) =>
  x === undefined || x === null || x === '' ? '—' : `${x} ${unit}`;

export default function TicketPreview({ savedTicket = null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const deletingRef = useRef(false);
  const [ticket, setTicket] = useState(savedTicket);
  const [error, setError] = useState('');
  const [pdfPreview, setPdfPreview] = useState(null);
  const [showPdf, setShowPdf] = useState(false);
  const pdfDialog = useRef(null);

  const deleteTrip = async () => {
    if (deletingRef.current) return;
    deletingRef.current = true;
    try {
      const deleted = await showDialog({
        title: 'Delete Trip?',
        message: `Permanently delete trip ${ticket.ticketNo}? This cannot be undone.`,
        confirm: true,
        confirmLabel: 'Delete Trip',
        loadingLabel: 'Deleting Trip...',
        onConfirm: async () => {
          try {
            await api.delete(`/tickets/${id}`);
          } catch (error) {
            throw new Error(error.response?.data?.message || 'Unable to delete trip. Please try again.');
          }
        },
      });
      if (deleted) {
        await showDialog({ type: 'success', title: 'Trip Deleted', message: 'The trip has been deleted successfully.', confirmLabel: 'Back to Records' });
        navigate('/tickets', { replace: true });
      }
    } finally {
      deletingRef.current = false;
    }
  };

  useEffect(() => {
    if (!showPdf) return;
    const dialog = pdfDialog.current;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [showPdf]);

  useEffect(() => {
    if (!ticket || !showPdf) return;
    let active = true;
    let url;
    setPdfPreview({ ticket, loading: true });
    createTripTicketPdf(ticket)
      .then((pdf) => {
        if (!active) return;
        url = URL.createObjectURL(pdf.output('blob'));
        setPdfPreview({ ticket, url });
      })
      .catch(() => {
        if (active) setPdfPreview({ ticket, error: 'Unable to generate the PDF preview. Reload the page to try again.' });
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [ticket, showPdf]);

  useEffect(() => {
    if (savedTicket) {
      setTicket(savedTicket);
      return;
    }
    let active = true;
    setTicket(null);
    setShowPdf(false);
    setError('');
    api
      .get(`/tickets/${id}`)
      .then(({ data }) => {
        if (active) setTicket(data.ticket);
      })
      .catch(() => {
        if (active)
          setError(
            'Unable to load trip preview. Please return to records and try again.',
          );
      });
    return () => {
      active = false;
    };
  }, [id, savedTicket]);

  if (!ticket)
    return (
      <div className="stack-lg">
        <Link to="/tickets" className="back-link">
          <ArrowLeft size={15} /> Back to Records
        </Link>
        <div role="status" className={error ? 'alert error' : ''}>
          {error || 'Loading trip preview…'}
        </div>
      </div>
    );

  const report = ticket.report || {};
  const fuel = [report.fuelBalance, report.fuelIssued, report.fuelPurchased];
  const totalFuel = fuel.some((x) => x !== undefined && x !== null && x !== '')
    ? fuel.reduce((sum, x) => sum + Number(x || 0), 0)
    : null;
  const distance =
    report.speedometerStart != null && report.speedometerEnd != null
      ? Math.max(
          0,
          Number(report.speedometerEnd) - Number(report.speedometerStart),
        )
      : report.speedometerDistance;
  const details = (fields) => (
    <div className="detail-grid">
      {fields.map(([label, content]) => (
        <div key={label}>
          <small>{label}</small>
          <b>{value(content)}</b>
        </div>
      ))}
    </div>
  );

  return (
    <div className="stack-lg">
      <div className="page-heading">
        <div>
          {!savedTicket && <Link to="/tickets" className="back-link">
            <ArrowLeft size={15} /> Back to Records
          </Link>}
          <span className="eyebrow">TRIP PREVIEW</span>
          <h1>{ticket.ticketNo}</h1>
          <p>
            {ticket.destination} · {date(ticket.travelDate)}
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="btn secondary"
            onClick={() => {
              setPdfPreview(null);
              setShowPdf(true);
            }}
            aria-haspopup="dialog"
            aria-expanded={showPdf}
            aria-controls="trip-pdf-preview"
          >
            Show PDF Preview
          </button>
          {!savedTicket && <Link className="btn secondary" to={`/tickets/${id}`}>
            Manage Trip
          </Link>}
          <button className="btn primary" onClick={() => makePdf(ticket)}>
            <FileDown size={16} /> Export PDF
          </button>
          {!savedTicket && <button type="button" className="btn danger" onClick={deleteTrip}>
            <Trash2 size={16} /> Delete Trip
          </button>}
        </div>
      </div>
      {showPdf && <dialog
        ref={pdfDialog}
        id="trip-pdf-preview"
        className="pdf-preview-dialog"
        aria-labelledby="pdf-preview-title"
        onCancel={() => setShowPdf(false)}
        onClose={() => setShowPdf(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setShowPdf(false);
        }}
      ><section className="pdf-modal-content">
        <div className="panel-heading">
          <div><h3 id="pdf-preview-title">PDF preview</h3><p>Same layout as the exported trip ticket.</p></div>
          <div className="heading-actions">
          {pdfPreview?.ticket === ticket && pdfPreview.url && (
            <a className="text-link" href={pdfPreview.url} target="_blank" rel="noopener noreferrer">Open PDF in new tab</a>
          )}
          <button type="button" className="btn secondary" onClick={() => setShowPdf(false)} autoFocus aria-label="Close PDF preview"><X size={18} /> Close</button>
          </div>
        </div>
        {pdfPreview?.ticket === ticket && pdfPreview.url ? (
          <PdfPreview url={pdfPreview.url} />
        ) : (
          <div className="pdf-preview-status" role="status">
            {pdfPreview?.ticket === ticket && pdfPreview.error ? pdfPreview.error : 'Preparing PDF preview...'}
          </div>
        )}
        <p className="pdf-preview-help">If the preview does not display, open the PDF in a new tab or use Export PDF.</p>
      </section></dialog>}
      <section className="panel detail-panel">
        <div className="panel-heading">
          <div>
            <h3>Section A · Travel Details</h3>
            <p>Official travel authorization</p>
          </div>
        </div>
        {details([
          ['Ticket number', ticket.ticketNo],
          ['Travel date', date(ticket.travelDate)],
          ['Driver', ticket.driverName],
          ['Government car / plate', ticket.vehiclePlate],
          ['Authorized passengers', formatPassengerNames(ticket.passengerName)],
          ['Destination(s)', ticket.destination],
          ['Purpose', ticket.purpose],
          ['Approved by', ticket.approvedBy],
        ])}
      </section>
      <section className="panel detail-panel">
        <div className="panel-heading">
          <div>
            <h3>Section B · Driver’s Report</h3>
            <p>Recorded travel times, fuel consumption, and vehicle readings</p>
          </div>
        </div>
        {details([
          ['Departure from office / garage', displayTime(report.departureTime)],
          ['Arrival at destination', displayTime(report.arrivalTime)],
          ['Departure from destination', displayTime(report.destinationDepartureTime)],
          ['Arrival back at office / garage', displayTime(report.returnTime)],
          [
            'Approximate distance travelled',
            quantity(report.distanceTravelled, 'km'),
          ],
          ['Fuel balance in tank', quantity(report.fuelBalance, 'liters')],
          ['Fuel issued by office', quantity(report.fuelIssued, 'liters')],
          [
            'Fuel purchased during trip',
            quantity(report.fuelPurchased, 'liters'),
          ],
          ['Total fuel available', quantity(totalFuel, 'liters')],
          ['Fuel used during trip', quantity(report.fuelUsed, 'liters')],
          [
            'Fuel balance at end of trip',
            quantity(report.fuelEndingBalance, 'liters'),
          ],
          ['Gear oil used', quantity(report.gearOil, 'liters')],
          ['Lubricating oil used', quantity(report.lubricatingOil, 'liters')],
          ['Grease issued', quantity(report.grease, 'liters')],
          ['Speedometer at beginning', quantity(report.speedometerStart, 'km')],
          ['Speedometer at end', quantity(report.speedometerEnd, 'km')],
          ['Speedometer distance travelled', quantity(distance, 'km')],
          ['Remarks', report.remarks],
          ['Passenger certification date', date(report.passengerSignedDate)],
        ])}
      </section>
    </div>
  );
}
