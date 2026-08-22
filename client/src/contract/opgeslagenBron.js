import { valideerBericht } from './schema.js';

// Opgeslagen bron: geen verbinding, een eerder vastgelegde stream uit een
// bestand. De bestanden zijn afgeleid uit de showcase-cbt stubbundel en niet
// overgenomen — zie scripts/opnames.mjs — en dragen tijdstempels, dus een opname
// speelt zo lang als de run duurde. Bij bundel 0.13.0 is dat 84, 30, 77 en 60
// berichten over 83, 29, 76 en 87 seconden. Zelfde consument als de live bron:
// dezelfde validatie, dezelfde tolerantie. Het enige verschil zit aan de
// invoerkant.
export function maakOpgeslagenBron({ pad, onBericht }) {
  let getimede = [];
  let lopendeTimeouts = [];
  let geladen = false;

  async function laadEenmalig() {
    if (geladen) return;
    const res = await fetch(pad);
    if (!res.ok) throw new Error(`kon opgeslagen stream niet laden: ${pad} (HTTP ${res.status})`);

    // Een ontbrekende opname komt hier niet als 404 binnen. De dev-server — en
    // de meeste statische hosts met een SPA-terugval — antwoorden op een
    // onbekend pad met de index-HTML en status 200, dus `res.ok` hierboven zegt
    // niets over of dit een opname is. Gemeten op 22-08: je kreeg
    // `SyntaxError: Unexpected token '<'`, een melding over JSON terwijl het
    // probleem is dat het bestand er niet is.
    //
    // Dat is precies de fout die een nieuwe opname uitlokt: verkeerde naam,
    // asset niet meegekomen in de bundel. Die hoort te zeggen wat er aan de hand
    // is, en dat kan alleen door naar het content-type te kijken.
    const type = res.headers.get('content-type') || '';
    if (!type.includes('json')) {
      throw new Error(
        `opgeslagen stream ${pad} bestaat niet of is geen JSON — de server gaf ` +
          `content-type "${type || 'onbekend'}" bij HTTP ${res.status}`
      );
    }

    const berichten = await res.json();
    // Een array is niet vanzelfsprekend: één opname is een lijst berichten, maar
    // de stamdatakopieën in dezelfde map zijn objecten. Het verkeerde bestand
    // aanwijzen hoort hier te stoppen en niet verderop op `.map`.
    if (!Array.isArray(berichten)) {
      throw new Error(`opgeslagen stream ${pad} is geen lijst berichten maar ${typeof berichten}`);
    }
    const eersteTijd = berichten.length ? new Date(berichten[0].tijd).getTime() : 0;
    getimede = berichten.map((bericht) => ({
      bericht,
      vertraging: new Date(bericht.tijd).getTime() - eersteTijd,
    }));
    geladen = true;
  }

  function speelAf() {
    stop();
    for (const { bericht, vertraging } of getimede) {
      const id = setTimeout(() => {
        const { ok } = valideerBericht(bericht);
        if (ok) onBericht(bericht);
      }, vertraging);
      lopendeTimeouts.push(id);
    }
  }

  function stop() {
    lopendeTimeouts.forEach(clearTimeout);
    lopendeTimeouts = [];
  }

  async function start() {
    await laadEenmalig();
    speelAf();
    return { ok: true };
  }

  return { start, stop };
}
