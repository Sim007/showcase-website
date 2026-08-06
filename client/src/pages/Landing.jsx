import { useEffect, useState } from 'react';
import { fetchIntro, fetchShowcases } from '../api.js';
import { renderMarkdown } from '../simpleMarkdown.js';
import ShowcaseTile from '../components/ShowcaseTile.jsx';

export default function Landing() {
  const [intro, setIntro] = useState('');
  const [showcases, setShowcases] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIntro().then((d) => setIntro(d.markdown)).catch((e) => setError(e.message));
    fetchShowcases().then(setShowcases).catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="page">
        <p>Kon de pagina niet laden: {error}. Draait de server op poort 4000?</p>
      </div>
    );
  }

  return (
    <div className="page landing-page">
      <div className="top-nav">
        <span className="brand">showcase-cbt</span>
      </div>

      <div className="intro">
        {renderMarkdown(intro).map((b) => {
          const Tag = b.tag;
          return <Tag key={b.key} dangerouslySetInnerHTML={{ __html: b.html }} />;
        })}
        <p className="hint">Deze tekst komt uit content/intro.md — bewerk dat bestand om de intro aan te passen.</p>
      </div>

      <div className="tiles">
        {showcases.map((s) => (
          <ShowcaseTile key={s.id} showcase={s} />
        ))}
      </div>
    </div>
  );
}
