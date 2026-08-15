import { useEffect, useRef } from 'react';

// Toont de daadwerkelijke CLI-regels terwijl ze "lopen" — geen samenvatting,
// het exacte commando uit de pipeline-scripts.
export default function CliPanel({ steps }) {
  const bodyRef = useRef(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [steps]);

  const touched = steps.filter((s) => s.uitkomst && s.uitkomst !== 'wachtend');

  return (
    <div className="cli-panel" ref={bodyRef}>
      {touched.length === 0 && <div className="empty">$ wacht op start...</div>}
      {touched.map((step) => {
        if (step.uitkomst === 'niet-uitgevoerd') {
          return (
            <div key={`${step.nr}-line`} className="line result-niet-uitgevoerd">
              · {step.stap} — niet uitgevoerd, pipeline van dit deelsysteem is gestopt
            </div>
          );
        }
        return (
          <div key={`${step.nr}-line`}>
            <div className="line">
              <span className="prompt">$ </span>
              {step.cli}
            </div>
            {(step.cliRegels || []).map((regel, i) => (
              <div className="line" key={i}>{regel}</div>
            ))}
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
