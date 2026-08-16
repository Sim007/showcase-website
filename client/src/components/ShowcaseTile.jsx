import { Link } from 'react-router-dom';

export default function ShowcaseTile({ showcase }) {
  const clickable = showcase.status === 'werkt';
  const content = (
    <>
      <div className="nr">Scenario {showcase.id}</div>
      <h3>{showcase.titel}</h3>
      <p>{showcase.beschrijving}</p>
      <span className={`badge ${clickable ? 'werkt' : 'binnenkort'}`}>
        {clickable ? '● werkt' : '○ binnenkort'}
      </span>
    </>
  );

  if (clickable) {
    return (
      <Link className="tile" data-clickable="true" to={`/scenario/${showcase.id}`}>
        {content}
      </Link>
    );
  }
  return (
    <div className="tile" data-clickable="false">
      {content}
    </div>
  );
}
