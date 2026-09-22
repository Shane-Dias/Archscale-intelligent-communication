import { useState } from "react";
import ProjectSidebar from "./components/ProjectSidebar";
import ThemeToggle from "./components/ThemeToggle";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [navSearch, setNavSearch] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");

  function handleNavSearchSubmit(e) {
    e.preventDefault();
    setNavSearch(pendingSearch.trim());
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans dark:bg-slate-950 dark:text-slate-100">

      {/* ── Top Navigation Bar ── */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-white dark:border-slate-800 dark:bg-slate-950">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-6">

          {/* Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            <div className="leading-tight">
              <span className="font-bold text-sm tracking-tight text-white">ArchScale</span>
              <span className="text-xs text-slate-400 font-normal hidden md:block">Project Communication Intelligence</span>
            </div>
          </div>

          {/* Search bar — centre of navbar */}
          <form
            onSubmit={handleNavSearchSubmit}
            className="flex-1 max-w-xl flex items-center gap-2"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <input
                id="nav-search-input"
                type="text"
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                placeholder="Search tasks, decisions, conversations…"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              />
              {pendingSearch && (
                <button
                  type="button"
                  onClick={() => { setPendingSearch(""); setNavSearch(""); }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition"
                  aria-label="Clear search"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!pendingSearch.trim()}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:text-slate-500 text-white transition flex-shrink-0"
            >
              Search
            </button>
          </form>

          {/* Right side — sync indicator + avatar */}
          <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
            <ThemeToggle />
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-slate-800 rounded-full border border-slate-700 text-xs text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-cyan-700 text-cyan-100 flex items-center justify-center font-bold text-xs ring-2 ring-slate-800 flex-shrink-0">
              AS
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        <ProjectSidebar
          selectedId={selectedProjectId}
          onSelect={setSelectedProjectId}
        />
        <main className="flex-1 min-w-0">
          <Dashboard
            projectId={selectedProjectId}
            externalSearch={navSearch}
            onExternalSearchConsumed={() => setNavSearch("")}
          />
        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <div className="max-w-[1720px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300">ArchScale Intelligence Engine</span>
            <span>— Real-time Project Communications</span>
          </div>
          <span className="text-slate-400 dark:text-slate-500">AI-powered extraction · Gemini</span>
        </div>
      </footer>

    </div>
  );
}
