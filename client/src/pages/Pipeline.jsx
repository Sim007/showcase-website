import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePipelineRun } from '../usePipelineRun.js';
import { DEELSYSTEEM_LABELS } from '../statusMeta.js';
import PipelineGraph from '../components/PipelineGraph.jsx';
import CliPanel from '../components/CliPanel.jsx';

const OPGESLAGEN_VARIANTEN = [
  { key: 'voltooid', label: 'opgeslagen run: voltooid' },
  { key: 'gestopt', label: 'opgeslagen run: gestopt' },
  { key: 'midden', label: 'opgeslagen run: midden' },
];

// Drie toestanden, niet twee. "Niet verbonden" dekte zowel "showcase-CBT is er
// niet" als "we luisteren even niet omdat er geen run loopt" — dat laatste is
// de normale rusttoestand en hoort niet als storing te ogen. Dat we
// showcase-CBT kunnen bereiken weten we los van de stream: de stamdata op deze
// pagina kwam er net vandaan.
function verbindingsStatus({ bron, connected }) {
  if (bron !== 'live') return { klasse: 'opgeslagen', tekst: 'opgeslagen run — geen live verbinding' };
  if (connected) return { klasse: 'verbonden', tekst: 'verbonden met showcase-CBT' };
  return { klasse: 'gereed', tekst: 'showcase-CBT gereed — nog geen run' };
}

export default function Pipeline() {
  const { id } = useParams();
  const [bron, setBron] = useState('live');
  const opgeslagenPad = bron === 'live' ? undefined : `/opgeslagen/${bron}.json`;
  const { dataset, steps, deelsysteemStatussen, error, connected, running, scenarioId, start } = usePipelineRun(id, {
    bron: bron === 'live' ? 'live' : 'opgeslagen',
    opgeslagenPad,
  });
  const [uitgeschakeld, setUitgeschakeld] = useState(() => new Set());

  const deelsystemen = useMemo(() => {
    const set = new Set(steps.map((s) => s.deelsysteem).filter((d) => d !== 'keten'));
    return [...set];
  }, [steps]);

  // Alle omgevingen uit de stamdata, niet alleen de omgevingen die in déze
  // (dunne, contract-voorbeeld) dataset toevallig een stap hebben — anders
  // verdwijnt bv. "Test" zodra geen enkele stap er nu op draait, terwijl het
  // scenario die omgeving wel degelijk kent.
  const omgevingenKolommen = useMemo(() => {
    if (!dataset) return [];
    return [{ key: 'code', label: 'Code' }, ...dataset.omgevingen.map((o) => ({ key: o.id, label: o.naam }))];
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
        <p>Kon scenario {id} niet laden: {error}.</p>
      </div>
    );
  }
  if (!dataset) return <div className="page"><p>Laden...</p></div>;

  const runningThisScenario = running && scenarioId === dataset.id;
  const runningOtherScenario = running && scenarioId !== dataset.id;
  const status = verbindingsStatus({ bron, connected });
  const verkeerdeStamdata = dataset.id !== id;

  return (
    <div className="page pipeline-page">
      <div className="top-nav">
        <Link className="brand" to="/">← showcase-cbt</Link>
        <select className="bron-select" value={bron} onChange={(e) => setBron(e.target.value)}>
          <option value="live">live</option>
          {OPGESLAGEN_VARIANTEN.map((v) => (
            <option key={v.key} value={v.key}>{v.label}</option>
          ))}
        </select>
        <span className={`verbinding ${status.klasse}`}>{status.tekst}</span>
      </div>

      <div className="pipeline-header">
        <div>
          <h1>Scenario {dataset.id} — {dataset.titel}</h1>
          <p>{dataset.ondertitel}</p>
        </div>
      </div>

      <h2 className="sectiekop">Deelsystemen</h2>
      <div className="meta-row">
        <div className="deelsystemen-banner">
          {deelsystemen.map((d) => {
            const uit = uitgeschakeld.has(d);
            const naam = DEELSYSTEEM_LABELS[d] || d;
            return (
              <label
                key={d}
                className={`ds-pill ds-${d}${uit ? ' ds-pill-off' : ''}`}
                title={uit ? `${naam} weer tonen` : `${naam} verbergen`}
              >
                <input type="checkbox" checked={!uit} onChange={() => toggleDeelsysteem(d)} />
                {naam}
              </label>
            );
          })}
        </div>

        <div className="legend">
          <span className="item" style={{ color: 'var(--text-muted)' }}>○ wachtend</span>
          <span className="item" style={{ color: 'var(--series-1)' }}>◐ lopend</span>
          <span className="item" style={{ color: 'var(--status-good)' }}>✓ groen</span>
          <span className="item" style={{ color: 'var(--status-critical)' }}>✕ rood</span>
          <span className="item" style={{ color: 'var(--text-muted)' }}>– niet uitgevoerd</span>
        </div>
      </div>

      <h2 className="sectiekop">Dashboard</h2>
      <div className="controls">
        <button className="primary" onClick={() => start(id)} disabled={running}>
          {runningThisScenario ? 'bezig...' : runningOtherScenario ? 'wacht op ander scenario' : 'Start scenario'}
        </button>
        <Link className="ghost" to={`/scenario/${id}/rapport`}>Rapport</Link>
      </div>

      {verkeerdeStamdata && (
        <div className="melding">
          Je vroeg scenario {id} op, maar showcase-CBT leverde de stappen van scenario {dataset.id}. Wat je
          hieronder ziet is dus scenario {dataset.id}, niet {id}.
        </div>
      )}

      {runningOtherScenario && (
        <div className="melding">
          Er loopt een run voor scenario {scenarioId}, en hieronder staan de stappen van scenario {dataset.id}.
          Er kan er één tegelijk lopen, dus deze stappen blijven wachtend tot die run klaar is.
        </div>
      )}

      <PipelineGraph steps={zichtbareSteps} statussen={deelsysteemStatussen} omgevingen={omgevingenKolommen} />

      <h2 className="sectiekop">Uitvoering</h2>
      <CliPanel steps={steps} />
    </div>
  );
}
