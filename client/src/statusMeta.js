export const OMGEVINGEN = [
  { key: 'code', label: 'Code' },
  { key: 'ci', label: 'CI' },
  { key: 'test', label: 'Test' },
  { key: 'acceptatie', label: 'Acceptatie' },
];

export const DEELSYSTEEM_LABELS = {
  payment: 'Payment',
  order: 'Order',
  keten: 'Order + Payment',
};

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
