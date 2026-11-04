export default function HeroArt() {
  return (
    <svg
      viewBox="0 0 520 520"
      className="h-auto w-full max-w-lg drop-shadow-2xl"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="arm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="55%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#155eef" />
        </linearGradient>
        <filter id="soft">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <circle cx="250" cy="260" r="180" fill="#38bdf8" opacity="0.12" filter="url(#soft)" />
      <g fill="none" stroke="url(#arm)" strokeWidth="7" strokeLinecap="round">
        <path d="M70 310c80-10 120-90 210-96 70-4 120 28 168 88" />
        <path d="M92 338c70-8 110-70 188-76" />
        <path d="M250 214v-86" />
        <path d="M250 128c28-40 78-52 118-28" />
        <path d="M250 128c-18-46-70-62-118-24" />
        <circle cx="368" cy="100" r="18" />
        <circle cx="132" cy="104" r="18" />
        <path d="M368 118c8 40-6 78-38 108" />
        <path d="M132 122c-4 42 18 80 54 108" />
      </g>
      {[
        [250, 214],
        [210, 250],
        [290, 248],
        [188, 300],
        [312, 298],
        [250, 128],
        [368, 100],
        [132, 104],
        [330, 226],
        [170, 226],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="6" fill="#e0f2fe" />
      ))}
    </svg>
  );
}
