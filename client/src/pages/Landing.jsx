import { useEffect, useState } from 'react';
import { fetchIntro, fetchShowcases } from '../api.js';
import { renderMarkdown } from '../simpleMarkdown.js';
import { useLiveRun } from '../LiveRunProvider.jsx';
import ShowcaseTile from '../components/ShowcaseTile.jsx';

export default function Landing() {
  const [intro, setIntro] = useState('');
  const [showcases, setShowcases] = useState([]);
  const [error, setError] = useState(null);
  const { vergeetAfgerondeRun } = useLiveRun();

  // Hier terugkomen is het einde van je blik op de vorige run: een scenario dat
  // je hierna opent, hoort leeg te beginnen. Een run die nog loopt blijft staan —
  // die zie je bij terugkomst gewoon verder lopen.
  useEffect(() => {
    vergeetAfgerondeRun();
  }, [vergeetAfgerondeRun]);

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
