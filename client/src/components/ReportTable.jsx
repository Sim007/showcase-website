import { OUTCOME_META } from '../statusMeta.js';
import { labelVan } from '../deelsysteemLabels.js';

// Herziene rapportstructuur: unieke nummering, omgeving inclusief Code,
// een expliciete kolom voor het staptype (actie/gate), en het deelsysteem
// waar de stap bij hoort (payment/order/keten).
export default function ReportTable({ steps, labels = {} }) {
  return (
    <table className="report-table">
      <thead>
        <tr>
          <th>Nr</th>
          <th>Omgeving</th>
          <th>Deelsysteem</th>
          <th>Type</th>
          <th>Stap</th>
          <th>CLI-regel</th>
          <th>Uitkomst</th>
          <th>Tijd</th>
          <th>Bijzonderheden</th>
        </tr>
      </thead>
      <tbody>
        {steps.map((step) => {
          const outcome = OUTCOME_META[step.uitkomst] || OUTCOME_META.wachtend;
          return (
            <tr key={step.nr}>
              <td className="nr">{step.nr}</td>
              <td className="omgeving">{step.omgeving}</td>
              <td className="deelsysteem">{labelVan(labels, step.deelsysteem)}</td>
              <td><span className="type-pill">{step.type}</span></td>
              <td>{step.stap}</td>
              <td className="cli">{step.cli || '—'}</td>
              <td>
                <span className={`outcome ${step.uitkomst || 'wachtend'}`}>
                  {outcome.glyph} {outcome.label}
                </span>
              </td>
              <td className="tijd">{step.tijd || '—'}</td>
              <td className="bijzonderheden">{step.bijzonderheden}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
