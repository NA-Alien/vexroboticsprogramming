import { useId } from 'react';
import RoutineDiagram from './RoutineDiagram.jsx';

function Robot({ x, y, angle = 0 }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <rect x="-23" y="-31" width="15" height="9" rx="2" className="robot-wheel"/><rect x="9" y="-31" width="15" height="9" rx="2" className="robot-wheel"/>
    <rect x="-23" y="22" width="15" height="9" rx="2" className="robot-wheel"/><rect x="9" y="22" width="15" height="9" rx="2" className="robot-wheel"/>
    <rect x="-31" y="-23" width="62" height="46" rx="3" className="robot-body"/>
    <circle cx="-24" cy="-16" r="2"/><circle cx="-24" cy="16" r="2"/><circle cx="24" cy="-16" r="2"/><circle cx="24" cy="16" r="2"/>
    <path d="M-10 0H13m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.4"/>
  </g>;
}

export default function Diagram({ type = 'wall', compact = false }) {
  const id = useId().replaceAll(':', '');
  if (type === 'routine') return <RoutineDiagram/>;
  if (type === 'x-drive') return <figure className="diagram">
    <svg viewBox="0 0 520 330" role="img" aria-labelledby={`${id}-title`}>
      <title id={`${id}-title`}>X-drive viewed from above. Positive wheel travel points forward-right at the front-left and back-right corners, and forward-left at the front-right and back-left corners.</title>
      <rect x="153" y="68" width="214" height="206" rx="3" className="robot-body"/>
      <path d="M260 60V22m-6 8 6-8 6 8" className="vector"/>
      <text x="279" y="36">Front</text>
      {[{ x: 160, y: 78, angle: 45 }, { x: 360, y: 78, angle: -45 }, { x: 160, y: 264, angle: -45 }, { x: 360, y: 264, angle: 45 }].map(({ x, y, angle }) => <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${angle})`}>
        <rect x="-9" y="-27" width="18" height="54" rx="3" className="robot-wheel"/>
        <path d="M0 17V-17m-5 7 5-7 5 7" className="vector"/>
      </g>)}
      <text x="18" y="76">Front left</text><text x="18" y="98" className="diagram-note">Port 1</text>
      <text x="407" y="76">Front right</text><text x="407" y="98" className="diagram-note">Port 2</text>
      <text x="18" y="259">Back left</text><text x="18" y="281" className="diagram-note">Port 3</text>
      <text x="407" y="259">Back right</text><text x="407" y="281" className="diagram-note">Port 4</text>
      <text x="209" y="164">Robot front ↑</text><text x="209" y="188">Robot right →</text>
      <text x="121" y="318" className="diagram-note">Arrows show positive wheel rolling directions.</text>
    </svg>
    <figcaption>Omni wheels at 45°, viewed from above. Set motor reversals to match these arrows before using the mixer.</figcaption>
  </figure>;
  if (type === 'tracking') return <figure className="diagram">
    <svg viewBox="0 0 520 300" role="img" aria-labelledby={`${id}-title`}>
      <title id={`${id}-title`}>Top view of two tracking wheels: the forward tracker on Port 7 rolls front to back; the sideways tracker on Port 8 rolls left to right. The inertial sensor uses Port 5.</title>
      <rect x="155" y="55" width="205" height="205" rx="3" className="robot-body"/>
      <path d="M257 46V15m-5 6 5-6 5 6" className="vector"/>
      <text x="278" y="27">Front</text>
      <rect x="186" y="155" width="16" height="48" rx="2" className="robot-wheel"/>
      <rect x="234" y="108" width="48" height="16" rx="2" className="robot-wheel"/>
      <path d="M194 150v-22m-4 5 4-5 4 5M228 116h-22m5-4-5 4 5 4" className="vector"/>
      <path d="M194 179h63v-63" className="dashed"/>
      <path d="M250 179h14m-7-7v14" className="axis"/>
      <circle cx="310" cy="220" r="8" className="sensor-dot"/>
      <path d="M178 179H119M288 116h87M319 220h54" className="annotation"/>
      <text x="13" y="167">Forward tracker</text><text x="13" y="188" className="diagram-note">Port 7</text>
      <text x="376" y="105">Sideways tracker</text><text x="376" y="126" className="diagram-note">Port 8</text>
      <text x="375" y="212">Inertial</text><text x="375" y="233" className="diagram-note">Port 5</text>
      <text x="217" y="202" className="diagram-note">Tracking center</text>
    </svg>
    <figcaption>Example layout, viewed from above. Arrows show positive travel. Measure offsets on your own robot; this drawing is not to scale.</figcaption>
  </figure>;
  if (type === 'sorting') return <figure className="diagram">
    <svg viewBox="0 0 520 240" role="img" aria-labelledby={`${id}-title`}>
      <title id={`${id}-title`}>A ring passes an optical sensor on the intake. Forward feeds it in; reversing sends an unwanted ring back out.</title>
      <path d="M65 88H450M65 160H450" className="axis"/>
      <circle cx="155" cy="124" r="24" fill="none" stroke="var(--accent)" strokeWidth="7"/>
      <circle cx="337" cy="124" r="24" fill="none" stroke="var(--muted)" strokeWidth="7"/>
      <rect x="225" y="43" width="44" height="29" rx="2" className="robot-body"/>
      <path d="M247 72v49" className="range-line"/>
      <text x="187" y="28">Optical Sensor</text>
      <path d="M290 54h115m-7-5 7 5-7 5" className="vector"/>
      <text x="305" y="38">Feed in</text>
      <path d="M215 193H90m7-5-7 5 7 5" className="vector"/>
      <text x="85" y="222">Reverse to eject</text>
      <text x="310" y="193" className="diagram-note">Intake path</text>
    </svg>
    <figcaption>Conceptual layout. Test whether reversing actually clears the unwanted ring on your intake.</figcaption>
  </figure>;
  const arrow = `${id}-arrow`, grid = `${id}-grid`;
  const titles = { wall: 'A forward-facing distance sensor measures the ray from the robot to a known east wall.', odom: 'Robot-local forward and sideways axes rotated counterclockwise into field X and Y.', pid: 'Illustrative damped heading response approaching a target over time.' };
  return <figure className={`diagram diagram-${type} ${compact ? 'diagram-compact' : ''}`}>
    <svg viewBox="0 0 520 330" role="img" aria-labelledby={`${id}-title`}>
      <title id={`${id}-title`}>{titles[type]}</title>
      <defs>
        <marker id={arrow} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker>
        <pattern id={grid} width="34" height="34" patternUnits="userSpaceOnUse"><path d="M34 0H0V34" fill="none" stroke="currentColor" strokeWidth=".6" opacity=".16"/></pattern>
      </defs>
      {type === 'pid' ? <>
        <path d="M65 40V275H465" className="axis" markerEnd={`url(#${arrow})`}/>
        <path d="M65 97H465" className="dashed"/>
        <text x="320" y="81">Target heading</text>
        <path d="M65 260C100 260 117 70 172 72S220 127 267 111S307 85 343 95S400 99 465 97" className="response"/>
        <text x="65" y="307">0</text><text x="395" y="307">Time (s)</text><text x="20" y="30">Heading (°)</text>
        <path d="M292 52v39" className="annotation"/><text x="266" y="40">Settling</text>
      </> : <>
        <rect x="64" y="40" width="378" height="237" fill={`url(#${grid})`}/>
        <path d="M64 32V277H467" className="axis" markerEnd={`url(#${arrow})`}/>
        <path d="M64 277V32" className="axis" markerEnd={`url(#${arrow})`}/>
        <text x="472" y="283">x</text><text x="58" y="23">y</text><text x="40" y="297">0</text>
        {type === 'wall' ? <>
          <path d="M442 40V277" className="wall-line"/>
          <text x="338" y="30">Wall at x = W</text>
          <path d="M226 175H442" className="range-line"/>
          <path d="M226 175V277" className="dashed"/>
          <Robot x={226} y={175}/>
          <circle cx="257" cy="175" r="4" className="sensor-dot"/>
          <path d="M267 144H430" className="measurement" markerStart={`url(#${arrow})`} markerEnd={`url(#${arrow})`}/>
          <text x="324" y="132">range d</text>
          <path d="M226 224H257" className="measurement"/><path d="M226 219v10m31-10v10" className="measurement"/>
          <text x="195" y="250">sensor offset</text><text x="190" y="302">robot X</text>
          <text x="82" y="72" className="diagram-note">θ = 0° · facing +X</text>
        </> : <>
          <path d="M231 191H382M231 191V81" className="dashed"/>
          <path d="M231 191L354 88" className="vector" markerEnd={`url(#${arrow})`}/>
          <path d="M231 191L160 106" className="vector-secondary" markerEnd={`url(#${arrow})`}/>
          <path d="M298 191A67 67 0 0 0 282 148" className="measurement"/>
          <text x="309" y="169">θ</text><text x="358" y="80">forward</text><text x="102" y="88">left</text>
          <Robot x={231} y={191} angle={-40}/>
          <circle cx="231" cy="191" r="3" className="sensor-dot"/>
          <text x="188" y="250">tracking center</text><text x="80" y="312">Inches · radians · counterclockwise positive</text>
        </>}
      </>}
    </svg>
    {!compact && <figcaption>{type === 'wall' ? 'A wall reading constrains one coordinate. Include the sensor’s offset from the tracking center.' : type === 'odom' ? 'The field frame stays fixed while the robot-local axes rotate with heading.' : 'Illustration only. Tune and measure the response on your own robot.'}</figcaption>}
  </figure>;
}
