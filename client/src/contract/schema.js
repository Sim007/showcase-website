import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schemas from './berichten-ontvangst.json';

// Ongewijzigd gebruikt, zoals afgesproken met squad showcase-cbt: geen eigen
// additionalProperties:false of enum erbovenop. Dat zou onbekende velden en
// onbekende opsommingswaarden alsnog laten breken, terwijl het contract een
// additieve wijziging expliciet niet-brekend noemt.
const ajv = addFormats(new Ajv({ strict: false }));
const validators = new Map();

function validatorVoor(naam) {
  if (!validators.has(naam)) {
    validators.set(naam, ajv.compile({ ...schemas, $ref: `#/components/schemas/${naam}` }));
  }
  return validators.get(naam);
}

// Onbekend berichttype: overslaan, geen fout — de soort-index kent hem niet.
// Bekend berichttype maar ongeldige vorm: ook overslaan, met een waarschuwing;
// dat is een echte contractschending en geen tolerantiegeval.
export function valideerBericht(bericht) {
  const naam = schemas.soortIndex[bericht?.soort];
  if (!naam) return { ok: false, reden: 'onbekend-berichttype' };

  const keur = validatorVoor(naam);
  if (!keur(bericht)) {
    console.warn(`Bericht van soort "${bericht.soort}" voldoet niet aan het schema:`, keur.errors);
    return { ok: false, reden: 'ongeldige-vorm', errors: keur.errors };
  }
  return { ok: true };
}
