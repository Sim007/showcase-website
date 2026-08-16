import { Link, useParams } from 'react-router-dom';
import { usePipelineRun } from '../usePipelineRun.js';
import { verbindingsStatus } from '../verbindingsStatus.js';
import ReportTable from '../components/ReportTable.jsx';

export default function Report() {
  const { id } = useParams();
  const { dataset, steps, error, bron, connected, verbindingWeg } = usePipelineRun(id);
  const status = verbindingsStatus({ bron, connected, verbindingWeg });

  if (error) {
    return (
      <div className="page">
        <p>Kon scenario {id} niet laden: {error}.</p>
      </div>
    );
  }
  if (!dataset) return <div className="page"><p>Laden...</p></div>;

  return (
    <div className="page">
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

      <ReportTable steps={steps} />
    </div>
  );
}
