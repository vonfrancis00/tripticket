import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AlertTriangle, LoaderCircle, X } from 'lucide-react';
import { closeDialog, confirmDialog, getDialog, subscribeDialog } from '../lib/dialog';

export default function AppDialog() {
  const current = useSyncExternalStore(subscribeDialog, getDialog);
  const ref = useRef(null);

  useEffect(() => {
    if (!current) return;
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [current?.resolve]);

  if (!current) return null;
  return (
    <dialog ref={ref} className="app-dialog" aria-labelledby={current.title ? 'app-dialog-title' : 'app-dialog-message'} aria-describedby={current.title ? 'app-dialog-message' : undefined}
      onCancel={(event) => { event.preventDefault(); closeDialog(); }}>
      <div className="app-dialog-header">
        <button type="button" className="app-dialog-close" disabled={current.pending} aria-label="Close popup" onClick={() => closeDialog()}><X size={20} /></button>
      </div>
      <span className="app-dialog-icon" aria-hidden="true">{current.pending ? <LoaderCircle className="app-dialog-spinner" size={28} /> : <AlertTriangle size={28} />}</span>
      {current.title && <h2 id="app-dialog-title">{current.title}</h2>}
      <p id="app-dialog-message">{current.message}</p>
      {current.pending && <p role="status" className="app-dialog-progress">{current.loadingLabel || 'Processing...'}</p>}
      {current.error && <p role="alert" className="app-dialog-error">{current.error}</p>}
      <div className="app-dialog-actions">
        {current.confirm && <button type="button" className="btn secondary" disabled={current.pending} autoFocus onClick={() => closeDialog()}>Cancel</button>}
        <button type="button" className={`btn ${current.confirm ? 'danger' : 'primary'}`} disabled={current.pending} autoFocus={!current.confirm} onClick={confirmDialog}>
          {current.pending ? 'Please wait...' : current.confirmLabel || 'OK'}
        </button>
      </div>
    </dialog>
  );
}
