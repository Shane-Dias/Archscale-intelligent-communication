import { useState } from "react";
import ProjectSidebar from "./components/ProjectSidebar";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      {/* ── BEGIN: TopNavigationBar ── */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-white" data-purpose="global-header">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Meta */}
          <div className="flex items-center gap-3 md:gap-5 min-w-fit">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-md shadow-cyan-500/20 text-white font-bold text-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                </svg>
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white">ArchScale</span>
                </div>
                <span className="text-xs text-slate-400 font-normal hidden sm:block">Project Communication Intelligence</span>
              </div>
            </div>
          </div>

          {/* Right Actions: Live Sync Status, Notifications, Profile Pill */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-slate-800/60 rounded-full border border-slate-700/50 text-xs text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Sync Active</span>
            </div>

            <button aria-label="Notifications" className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-500 rounded-full ring-2 ring-slate-900"></span>
            </button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-cyan-700 text-cyan-100 flex items-center justify-center font-bold text-xs ring-2 ring-slate-800">
                AS
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── BEGIN: Main Layout ── */}
      <div className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        <ProjectSidebar
          selectedId={selectedProjectId}
          onSelect={setSelectedProjectId}
        />
        <main className="flex-1 min-w-0">
          <Dashboard projectId={selectedProjectId} />
        </main>
      </div>

      {/* ── BEGIN: Footer ── */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-[1720px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">ArchScale Intelligence Engine</span>
            <span>— Real-time AEC Site Communications</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Connected to Project ERP & CDE · Last synced 2 minutes ago
          </div>
        </div>
      </footer>
    </div>
  );
}

