import { useEffect, useRef, useState } from 'react';

// Render pages ourselves: mobile browsers do not reliably display PDF iframes.
export default function PdfPreview({ url }) {
  const container = useRef(null);
  const [status, setStatus] = useState('Loading PDF pages...');

  useEffect(() => {
    let active = true;
    let loadingTask;
    let renderTask;
    const host = container.current;
    host.replaceChildren();
    setStatus('Loading PDF pages...');

    async function render() {
      try {
        const pdfjs = await import('pdfjs-dist');
        const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        if (!active) return;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        loadingTask = pdfjs.getDocument({ url });
        const pdf = await loadingTask.promise;
        for (let number = 1; number <= pdf.numPages; number += 1) {
          const page = await pdf.getPage(number);
          if (!active) return;
          const baseViewport = page.getViewport({ scale: 1 });
          // Match the 900px display width at retina density, with a 300 DPI cap
          // to keep large, multi-page previews within a reasonable memory budget.
          const displayWidth = Math.min(900, host.clientWidth || 900);
          const pixelRatio = Math.max(2, window.devicePixelRatio || 1);
          const scale = Math.min(300 / 72, Math.max(2, displayWidth * pixelRatio / baseViewport.width));
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', `Trip ticket PDF page ${number} of ${pdf.numPages}`);
          renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport });
          await renderTask.promise;
          if (!active) return;
          host.appendChild(canvas);
          page.cleanup();
        }
        setStatus('');
      } catch (error) {
        if (active) {
          console.error('Unable to render PDF preview:', error);
          setStatus('Unable to display PDF pages. Open the PDF in a new tab or use Export PDF.');
        }
      }
    }
    render();
    return () => {
      active = false;
      renderTask?.cancel();
      loadingTask?.destroy();
    };
  }, [url]);

  return (
    <div className="ticket-pdf-pages">
      {status && <p className="pdf-preview-status" role="status">{status}</p>}
      <div ref={container} />
    </div>
  );
}
