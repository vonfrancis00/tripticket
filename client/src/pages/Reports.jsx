import { ChartNoAxesCombined } from 'lucide-react';

export default function Reports() {
  return (
    <div className="stack-lg">
      <div className="page-heading">
        <div>
          <span className="eyebrow">REPORTING</span>
          <h1>Trip ticket reports</h1>
        </div>
      </div>
      <section className="reports-coming-soon" aria-labelledby="reports-coming-soon-title">
        <div className="reports-coming-soon-icon" aria-hidden="true">
          <ChartNoAxesCombined size={40} strokeWidth={1.6} />
        </div>
        <span className="reports-coming-soon-badge">IN DEVELOPMENT</span>
        <h2 id="reports-coming-soon-title">Coming soon!</h2>
        <p> A clearer view of your official travel activity is on the way.
          Check back soon for trip ticket reports and insights.</p>
        <div className="reports-coming-soon-footer">
          <span aria-hidden="true" /> Better insights. Smarter travel management.
        </div>
      </section>
    </div>
  );
}
