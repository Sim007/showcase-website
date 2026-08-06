import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './simpleMarkdown.js';

describe('renderMarkdown', () => {
  it('splits blocks on blank lines and defaults to paragraphs', () => {
    const blocks = renderMarkdown('eerste alinea\n\ntweede alinea');
    expect(blocks).toEqual([
      { key: 0, tag: 'p', html: 'eerste alinea' },
      { key: 1, tag: 'p', html: 'tweede alinea' },
    ]);
  });

  it('recognizes # and ## as headings', () => {
    const blocks = renderMarkdown('# Titel\n\n## Subtitel\n\nTekst');
    expect(blocks).toEqual([
      { key: 0, tag: 'h1', html: 'Titel' },
      { key: 1, tag: 'h2', html: 'Subtitel' },
      { key: 2, tag: 'p', html: 'Tekst' },
    ]);
  });

  it('converts **bold** to <strong> in any block type', () => {
    const blocks = renderMarkdown('# **Vet** kopje\n\nEen **vette** alinea');
    expect(blocks[0].html).toBe('<strong>Vet</strong> kopje');
    expect(blocks[1].html).toBe('Een <strong>vette</strong> alinea');
  });
});
