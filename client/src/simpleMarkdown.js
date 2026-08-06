// Kleine, afhankelijkheidsvrije renderer voor de bewerkbare intro.md.
// Bewust minimaal: koppen, paragrafen en **vet** — genoeg voor een introtekst.
export function renderMarkdown(markdown) {
  const blocks = markdown.trim().split(/\n\s*\n/);
  return blocks.map((block, i) => {
    const bolded = block.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    if (block.startsWith('## ')) {
      return { key: i, tag: 'h2', html: bolded.replace(/^##\s*/, '') };
    }
    if (block.startsWith('# ')) {
      return { key: i, tag: 'h1', html: bolded.replace(/^#\s*/, '') };
    }
    return { key: i, tag: 'p', html: bolded };
  });
}
