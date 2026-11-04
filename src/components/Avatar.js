export default function Avatar({ initials, accent, size = 56 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      aria-hidden="true"
      className="shrink-0 rounded-2xl"
    >
      <rect width="80" height="80" rx="18" fill={accent || "#155EEF"} />
      <text
        x="40"
        y="48"
        textAnchor="middle"
        fill="#F8FAFC"
        fontFamily="Unbounded, sans-serif"
        fontSize="22"
        fontWeight="600"
      >
        {initials}
      </text>
    </svg>
  );
}
