import { useTheme } from "../hooks/useTheme";

const SunIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    <path
      d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

const MoonIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

/**
 * Navbar light/dark switch.
 * In light mode it offers "Dark" (moon); in dark mode it offers "Light" (sun).
 */
export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const nextLabel = isDark ? "Light" : "Dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={`Switch to ${nextLabel.toLowerCase()} mode`}
      title={`Switch to ${nextLabel.toLowerCase()} mode`}
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-2.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 flex-shrink-0"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      <span className="hidden lg:inline">{nextLabel} mode</span>
    </button>
  );
}
