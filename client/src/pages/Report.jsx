import { Link, useParams } from 'react-router-dom';
import { usePipelineRun } from '../usePipelineRun.js';
import { verbindingsStatus } from '../verbindingsStatus.js';
import ReportTable from '../components/ReportTable.jsx';

export default function Report() {
  const { id } = useParams();
  const { dataset, steps, error, bron, connected, verbindingWeg, nietBereikbaar, stamdataUitLokaleKopie } =
    usePipelineRun(id);
  const status = verbindingsStatus({ bron, connected, verbindingWeg, nietBereikbaar, stamdataUitLokaleKopie });

  if (error) {
    return (
      <div className="page">
        <p>Kon scenario {id} niet laden: {error}.</p>
      </div>
    );
  }
  if (!dataset) return <div className="page"><p>Laden...</p></div>;

  // Zelfde regel als op het dashboard: een weggevallen verbinding bevriest het
  // beeld. Juist hier telt dat, want een tabel met uitkomsten leest als een
  // afgerond verslag — sterker dan "we weten het niet".
  const bevroren = verbindingWeg;

  return (
    <div className={`page${bevroren ? ' bevroren' : ''}`}>
      <div className="top-nav">
        <Link className="brand" to={`/scenario/${id}`}>← scenario {id}</Link>
        <span className={`verbinding ${status.klasse}`}>{status.tekst}</span>
      </div>

      <div className="pipeline-header">
        <div>
          <h1>Rapport — Scenario {dataset.id} — {dataset.titel}</h1>
          <p>{dataset.ondertitel}</p>
        </div>
      </div>

      {stamdataUitLokaleKopie && (
        <div className="melding">
          showcase-CBT was niet bereikbaar; de stappen hieronder komen uit een meegeleverde kopie.
        </div>
      )}

      {bevroren && (
        <div className="melding bevroren-melding">
          Verbinding met showcase-CBT weggevallen — dit is de laatste bekende stand, geen afgerond rapport.
        </div>
      )}

      <ReportTable steps={steps} />
    </div>
  );
}
