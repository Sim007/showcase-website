export const OMGEVINGEN = [
  { key: 'code', label: 'Code' },
  { key: 'ci', label: 'CI' },
  { key: 'test', label: 'Test' },
  { key: 'acceptatie', label: 'Acceptatie' },
];

// De namen van deelsystemen stonden hier hardcoded. Ze komen nu uit de stamdata
// van het scenario — zie deelsysteemLabels.js voor waarom.

export const OUTCOME_META = {
  wachtend: { glyph: '○', label: 'wachtend' },
  lopend: { glyph: '◐', label: 'lopend' },
  groen: { glyph: '✓', label: 'groen' },
  rood: { glyph: '✕', label: 'rood' },
  'niet-uitgevoerd': { glyph: '–', label: 'niet uitgevoerd' },
};

// Status per deelsysteem — afgeleid door de website, niet aangeleverd (zie
// deriveDeelsysteemStatus.js). Vier waarden, niet de drie uit de domeinlijst:
// 'lopend' is toegevoegd zodat een run die halverwege staat niet ten onrechte
// als "nog niet gestart" oogt.
export const DEELSYSTEEM_STATUS_META = {
  'nog-niet-gestart': { glyph: '○', label: 'nog niet gestart' },
  lopend: { glyph: '◐', label: 'lopend' },
  'succesvol-afgerond': { glyph: '✓', label: 'afgerond' },
  gestopt: { glyph: '✕', label: 'gestopt' },
};
