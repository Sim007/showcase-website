import { useEffect, useRef } from 'react';
import { DEELSYSTEEM_LABELS } from '../statusMeta.js';

// Eén regel uit het paneel. Regels die met "$ " beginnen zijn een commando —
// die krijgen dezelfde prompt-kleur, of ze nu uit de stream komen of uit de
// stamdata.
function Regel({ tekst }) {
  if (tekst?.startsWith('$ ')) {
    return (
      <div className="line">
        <span className="prompt">$ </span>
        {tekst.slice(2)}
      </div>
    );
  }
  return <div className="line">{tekst}</div>;
}

// Toont de daadwerkelijke CLI-regels terwijl ze "lopen" — geen samenvatting,
// het exacte commando uit de pipeline-scripts. Een kop per deelsysteem zodra
// het wisselt, zodat de regels niet ononderscheidbaar in elkaar overlopen.
//
// Zijn er uitvoerregels uit de stream, dan zijn díé het transcript: showcase-CBT
// echoot het commando zelf al mee. Het `cli`-veld uit de stamdata is dan niet
// hetzelfde feit maar dezelfde tekst, en tweemaal tonen oogt als een bug.
// Zolang er nog geen uitvoer is, staat het stamdata-commando er wel — dan laat
// het zien wát er draait.
export default function CliPanel({ steps }) {
  const bodyRef = useRef(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [steps]);

  const touched = steps.filter((s) => s.uitkomst && s.uitkomst !== 'wachtend');

  let vorigDeelsysteem = null;

  return (
    <div className="cli-panel" ref={bodyRef}>
      {touched.length === 0 && <div className="empty">$ wacht op start...</div>}
      {touched.map((step) => {
        const kop = step.deelsysteem !== vorigDeelsysteem;
        vorigDeelsysteem = step.deelsysteem;
        const label = DEELSYSTEEM_LABELS[step.deelsysteem] || step.deelsysteem;
        const regels = step.cliRegels || [];

        if (step.uitkomst === 'niet-uitgevoerd') {
          return (
            <div key={`${step.nr}-groep`}>
              {kop && <div className={`deelsysteem-kop ds-${step.deelsysteem}`}>{label}</div>}
              <div className="line result-niet-uitgevoerd">
                · {step.stap} — niet uitgevoerd, pipeline van dit deelsysteem is gestopt
              </div>
            </div>
          );
        }
        return (
          <div key={`${step.nr}-groep`}>
            {kop && <div className={`deelsysteem-kop ds-${step.deelsysteem}`}>{label}</div>}
            {regels.length > 0
              ? regels.map((regel, i) => <Regel key={i} tekst={regel} />)
              : <Regel tekst={`$ ${step.cli}`} />}
            {step.uitkomst !== 'lopend' && (
              <div className={`line result-${step.uitkomst}`}>
                {step.uitkomst === 'groen' ? '✓' : '✕'} {step.stap} — {step.bijzonderheden}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
