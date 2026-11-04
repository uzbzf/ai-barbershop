import Link from "next/link";

export default function Logo({ light = false }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span
        className={`grid h-10 w-10 place-items-center rounded-xl ${
          light ? "bg-white/15 text-sky-200" : "bg-[var(--brand)] text-white"
        }`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 4l3 8-3 8M17 4l-3 8 3 8M4 12h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span
        className={`font-display text-lg tracking-tight ${
          light ? "text-white" : "text-[var(--ink)]"
        }`}
      >
        Craft
      </span>
    </Link>
  );
}
