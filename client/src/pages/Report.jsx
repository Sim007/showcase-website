import { Link, useParams } from 'react-router-dom';
import { usePipelineRun } from '../usePipelineRun.js';
import ReportTable from '../components/ReportTable.jsx';

export default function Report() {
  const { id } = useParams();
  const { dataset, steps, error, connected } = usePipelineRun(id);

  if (error) {
    return (
      <div className="page">
        <p>Kon hoofdstuk {id} niet laden: {error}.</p>
      </div>
    );
  }
  if (!dataset) return <div className="page"><p>Laden...</p></div>;

  return (
    <div className="page">
      <div className="top-nav">
        <Link className="brand" to={`/hoofdstuk/${id}`}>← hoofdstuk {id}</Link>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {connected ? 'verbonden' : 'geen verbinding met de server'}
        </span>
      </div>

      <div className="pipeline-header">
        <div>
          <h1>Rapport — Hoofdstuk {dataset.id} — {dataset.titel}</h1>
          <p>{dataset.ondertitel}</p>
        </div>
      </div>

      <ReportTable steps={steps} />
    </div>
  );
}
