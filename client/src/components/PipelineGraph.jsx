import { DEELSYSTEEM_LABELS, DEELSYSTEEM_STATUS_META, OMGEVINGEN, OUTCOME_META } from '../statusMeta.js';

// Bouwt een rooster: rijen zijn deelsystemen (swimlanes, elk een eigen
// kleurblok over de volledige breedte), kolommen zijn omgevingen. Zo
// beginnen bv. alle 'Order'-stappen altijd op dezelfde hoogte, ongeacht
// hoeveel 'Payment'-stappen er in die kolom voor staan.
function buildGrid(steps) {
  const deelsysteemOrder = [];
  const cellMap = new Map();
  for (const step of steps) {
    const ds = step.deelsysteem || 'onbekend';
    if (!deelsysteemOrder.includes(ds)) deelsysteemOrder.push(ds);
    const cellKey = `${ds}|${step.omgeving}`;
    if (!cellMap.has(cellKey)) cellMap.set(cellKey, []);
    cellMap.get(cellKey).push(step);
  }
  return { deelsysteemOrder, cellMap };
}

// Jenkins-achtige weergave, maar dan als swimlanes: elk deelsysteem is een
// horizontale rij (payment/order/keten), elke omgeving een kolom daarbinnen.
// Vorm draagt het staptype (rondje=actie, ruit=gate); kleur draagt nooit
// alleen de status — icoon + label staan er altijd bij.
export default function PipelineGraph({ steps, statussen = {}, omgevingen }) {
  // Zonder expliciete lijst (bv. oudere aanroepers/tests): afleiden uit de
  // stappen, zoals voorheen. Meegegeven vanuit de stamdata (Pipeline.jsx) wint
  // altijd — dat toont ook een omgeving zonder stappen in déze dataset.
  const kolommen = omgevingen || OMGEVINGEN.filter((o) => steps.some((s) => s.omgeving === o.key));
  const { deelsysteemOrder, cellMap } = buildGrid(steps);
  const gridTemplateColumns = `140px repeat(${kolommen.length}, minmax(150px, 1fr))`;

  return (
    <div className="graph">
      <div className="graph-row graph-row-header" style={{ gridTemplateColumns }}>
        <div className="graph-corner" />
        {kolommen.map((o) => (
          <div className="col-head" key={o.key}>{o.label}</div>
        ))}
      </div>
      {deelsysteemOrder.map((ds) => {
        const dsStatus = statussen[ds] || 'nog-niet-gestart';
        const statusMeta = DEELSYSTEEM_STATUS_META[dsStatus] || DEELSYSTEEM_STATUS_META['nog-niet-gestart'];
        return (
        <div className={`swimlane ds-${ds}`} key={ds}>
          <div className="graph-row" style={{ gridTemplateColumns }}>
            <div className="lane-label">
              <h5>{DEELSYSTEEM_LABELS[ds] || ds}</h5>
              <span className={`ds-status ${dsStatus}`}>{statusMeta.glyph} {statusMeta.label}</span>
            </div>
            {kolommen.map((o) => {
              const cellSteps = cellMap.get(`${ds}|${o.key}`) || [];
              return (
                <div className="lane-cell" key={o.key}>
                  {cellSteps.map((step) => {
                    const outcome = OUTCOME_META[step.uitkomst] || OUTCOME_META.wachtend;
                    return (
                      <div className="node" key={step.nr} title={step.bijzonderheden || ''}>
                        <span className={`shape ${step.type} status-${step.uitkomst || 'wachtend'}`}>
                          <span className="glyph">{outcome.glyph}</span>
                        </span>
                        <span className="label">
                          <span className="nr">#{step.nr}</span>
                          <span className="stap">{step.stap}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        );
      })}
    </div>
  );
}
