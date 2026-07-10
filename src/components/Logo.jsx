// ---------------------------------------------------------------
// The brand mark: two heads, one shared shoulder line — community.
// Pure SVG: scales to any size, no image files, works in dark mode.
// ---------------------------------------------------------------
export default function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="dd-lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#dd-lg)" />
      <circle cx="17.5" cy="18" r="5.2" fill="white" />
      <circle cx="30.5" cy="18" r="5.2" fill="white" opacity="0.82" />
      <path d="M10 35.5c0-5.2 6.3-7.8 14-7.8s14 2.6 14 7.8"
        stroke="white" strokeWidth="4.6" strokeLinecap="round" fill="none" />
    </svg>
  )
}
