export default function NetworkBg({ className = "" }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 1440 720"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="glow" cx="30%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#0b3fa8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1440" height="720" fill="url(#glow)" />
      {[
        [120, 140],
        [260, 90],
        [380, 220],
        [180, 320],
        [520, 80],
        [640, 210],
        [720, 40],
        [860, 160],
        [980, 90],
        [1100, 240],
        [1240, 120],
        [1320, 300],
        [210, 480],
        [410, 400],
        [590, 520],
        [780, 430],
        [940, 560],
        [1120, 470],
        [1280, 580],
        [80, 600],
        [330, 640],
      ].map(([x, y], i, arr) => (
        <g key={`${x}-${y}`}>
          {arr[i + 1] ? (
            <line
              x1={x}
              y1={y}
              x2={arr[i + 1][0]}
              y2={arr[i + 1][1]}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
            />
          ) : null}
          {arr[i + 3] ? (
            <line
              x1={x}
              y1={y}
              x2={arr[i + 3][0]}
              y2={arr[i + 3][1]}
              stroke="rgba(56,189,248,0.16)"
              strokeWidth="1"
            />
          ) : null}
          <circle cx={x} cy={y} r="3" fill="#7dd3fc" />
        </g>
      ))}
    </svg>
  );
}
