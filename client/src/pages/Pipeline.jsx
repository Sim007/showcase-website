import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePipelineRun } from '../usePipelineRun.js';
import { OPGESLAGEN_VARIANTEN } from '../LiveRunProvider.jsx';
import { verbindingsStatus } from '../verbindingsStatus.js';
import { DEELSYSTEEM_LABELS } from '../statusMeta.js';
import PipelineGraph from '../components/PipelineGraph.jsx';
import CliPanel from '../components/CliPanel.jsx';

export default function Pipeline() {
  const { id } = useParams();
  const {
    dataset, steps, deelsysteemStatussen, error, stamdataUitLokaleKopie,
    bron, setBron, connected, verbindingWeg, running, scenarioId, start,
  } = usePipelineRun(id);
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
  const status = verbindingsStatus({ bron, connected, verbindingWeg, stamdataUitLokaleKopie });
  const verkeerdeStamdata = dataset.id !== id;

  // Valt de verbinding weg, dan bevriest het hele dashboard in plaats van dat
  // we losse statussen gaan herinterpreteren. Een stap op "lopend" is geen
  // ontbrekend gegeven maar een bewering dat er nú iets draait, en de wachtende
  // stappen beweren dat ze nog aan de beurt komen — allebei worden ze onwaar op
  // hetzelfde moment. Bevriezen zegt precies wat er aan de hand is: dit was de
  // stand, en verder weten we het niet.
  const bevroren = verbindingWeg;

  return (
    <div className={`page pipeline-page${bevroren ? ' bevroren' : ''}`}>
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
                <input
                  type="checkbox"
                  checked={!uit}
                  disabled={bevroren}
                  onChange={() => toggleDeelsysteem(d)}
                />
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

      {stamdataUitLokaleKopie && (
        <div className="melding">
          showcase-CBT was niet bereikbaar; de stappen hieronder komen uit een meegeleverde kopie. Ze kloppen
          met het scenario zoals het is opgehaald, maar zijn niet zojuist bij showcase-CBT gecontroleerd.
        </div>
      )}

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

      {bevroren && (
        <div className="melding bevroren-melding">
          Verbinding met showcase-CBT weggevallen — hieronder staat de laatste bekende stand. Wat er daarna
          gebeurde weten we niet. Start opnieuw om verder te kijken.
        </div>
      )}

      <PipelineGraph steps={zichtbareSteps} statussen={deelsysteemStatussen} omgevingen={omgevingenKolommen} />

      <h2 className="sectiekop">Uitvoering</h2>
      <CliPanel steps={steps} />
    </div>
  );
}
