import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePipelineRun } from '../usePipelineRun.js';
import { DEELSYSTEEM_LABELS } from '../statusMeta.js';
import PipelineGraph from '../components/PipelineGraph.jsx';
import CliPanel from '../components/CliPanel.jsx';

export default function Pipeline() {
  const { id } = useParams();
  const { dataset, steps, deelsysteemStatussen, error, connected, running, hoofdstuk, start, reset } = usePipelineRun(id);
  const [uitgeschakeld, setUitgeschakeld] = useState(() => new Set());

  const deelsystemen = useMemo(() => {
    if (!dataset) return [];
    const set = new Set(dataset.stappen.map((s) => s.deelsysteem).filter((d) => d !== 'keten'));
    return [...set];
  }, [dataset]);

  const zichtbareSteps = useMemo(
    () => steps.filter((s) => !uitgeschakeld.has(s.deelsysteem)),
    [steps, uitgeschakeld]
  );

  function toggleDeelsysteem(d) {
    setUitgeschakeld((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  if (error) {
    return (
      <div className="page">
        <p>Kon hoofdstuk {id} niet laden: {error}.</p>
      </div>
    );
  }
  if (!dataset) return <div className="page"><p>Laden...</p></div>;

  const runningThisChapter = running && hoofdstuk === id;
  const runningOtherChapter = running && hoofdstuk !== id;

  return (
    <div className="page pipeline-page">
      <div className="top-nav">
        <Link className="brand" to="/">← showcase-cbt</Link>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {connected ? 'verbonden' : 'geen verbinding met de server'}
        </span>
      </div>

      <div className="pipeline-header">
        <div>
          <h1>Hoofdstuk {dataset.id} — {dataset.titel}</h1>
          <p>{dataset.ondertitel}</p>
        </div>
        <div className="controls">
          <Link className="ghost" to={`/hoofdstuk/${id}/rapport`}>rapport</Link>
          <button className="ghost" onClick={reset} disabled={running}>reset</button>
          <button className="primary" onClick={() => start(id)} disabled={running}>
            {runningThisChapter ? 'bezig...' : runningOtherChapter ? 'wacht op ander hoofdstuk' : `Start hoofdstuk ${id}`}
          </button>
        </div>
      </div>

      <div className="meta-row">
        <div className="deelsystemen-banner">
          <span className="label">{deelsystemen.length} deelsystemen in deze pipeline:</span>
          {deelsystemen.map((d) => {
            const uit = uitgeschakeld.has(d);
            return (
              <button
                key={d}
                type="button"
                className={`ds-pill ds-${d}${uit ? ' ds-pill-off' : ''}`}
                aria-pressed={!uit}
                title={uit ? `${DEELSYSTEEM_LABELS[d] || d} weer tonen` : `${DEELSYSTEEM_LABELS[d] || d} verbergen`}
                onClick={() => toggleDeelsysteem(d)}
              >
                {DEELSYSTEEM_LABELS[d] || d}
              </button>
            );
          })}
        </div>

        <div className="legend">
          <span className="item">○ rondje = actie</span>
          <span className="item">◆ ruit = gate</span>
          <span className="item" style={{ color: 'var(--text-muted)' }}>○ wachtend</span>
          <span className="item" style={{ color: 'var(--series-1)' }}>◐ lopend</span>
          <span className="item" style={{ color: 'var(--status-good)' }}>✓ groen</span>
          <span className="item" style={{ color: 'var(--status-critical)' }}>✕ rood</span>
          <span className="item" style={{ color: 'var(--text-muted)' }}>– niet uitgevoerd</span>
        </div>
      </div>

      <PipelineGraph steps={zichtbareSteps} statussen={deelsysteemStatussen} />
      <CliPanel steps={steps} />
    </div>
  );
}
