import { useId } from 'react';

export default function RoutineDiagram() {
  const id = useId();
  return <figure className="routine-diagram">
    <svg viewBox="0 0 510 140" role="img" aria-labelledby={id}>
      <title id={id}>Three movements: forward 24 inches, turn clockwise to 90 degrees, reverse 12 inches.</title>
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="40" y="60" width="34" height="42" rx="2"/>
        <path d="M35 66v12m0 8v12m44-32v12m0 8v12M57 55V16m-5 6 5-6 5 6"/>
        <rect x="202" y="60" width="34" height="42" rx="2"/>
        <path d="M197 66v12m0 8v12m44-32v12m0 8v12M211 37a27 27 0 0 1 39 26m-7-5 7 5 3-8"/>
        <rect x="372" y="65" width="42" height="34" rx="2"/>
        <path d="M378 60h12m8 0h12m-32 44h12m8 0h12M365 82h-36m6-5-6 5 6 5"/>
      </g>
      <g className="routine-label"><text x="98" y="50">24 in</text><text x="260" y="50">90°</text><text x="436" y="82">12 in</text></g>
      <g className="routine-caption"><text x="57" y="130" textAnchor="middle">Drive</text><text x="219" y="130" textAnchor="middle">Turn</text><text x="393" y="130" textAnchor="middle">Reverse</text></g>
    </svg>
    <figcaption>Starting at heading 0°. Movements shown separately.</figcaption>
  </figure>;
}
