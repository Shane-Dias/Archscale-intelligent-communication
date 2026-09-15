import { useEffect, useState } from "react";
import { getProjects, createProject } from "../api/client";

export default function ProjectSidebar({ selectedId, onSelect }) {
  const [projects, setProjects] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await getProjects();
      setProjects(data);

      // Auto-select the first project if none selected
      if (!selectedId && data.length > 0) {
        onSelect(data[0]._id);
      }
    } catch {
      /* silent */
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError("");

    try {
      const created = await createProject(newName.trim());
      setProjects((prev) => [...prev, created]);
      setNewName("");
      setCreating(false);
      onSelect(created._id);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create project");
    }
  }

  const activeProject = projects.find((p) => p._id === selectedId);

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 space-y-6" data-purpose="sidebar-navigation">
      {/* Project Switcher Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">PROJECTS</span>
          <button
            onClick={() => setCreating((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-md px-2 py-1 transition"
            title="Add New Project"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            </svg>
            <span>{creating ? "Cancel" : "New"}</span>
          </button>
        </div>

        {creating && (
          <form onSubmit={handleCreate} className="mb-3 space-y-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <input
              type="text"
              className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              placeholder="New project name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button type="submit" className="px-3 py-1 text-xs font-semibold bg-cyan-700 text-white rounded hover:bg-cyan-800 transition">
                Add
              </button>
              <button type="button" onClick={() => setCreating(false)} className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700">
                Cancel
              </button>
            </div>
            {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
          </form>
        )}

        {/* Project List */}
        <div className="space-y-2.5">
          {projects.map((p) => {
            const isSelected = p._id === selectedId;
            return (
              <div
                key={p._id}
                onClick={() => onSelect(p._id)}
                className={`group relative rounded-lg p-3.5 shadow-sm border transition cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-800 hover:border-slate-700"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200/80"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${isSelected ? "bg-emerald-400" : "bg-cyan-500"}`}></span>
                    <h3 className={`font-semibold text-sm truncate ${isSelected ? "text-white" : "text-slate-900"}`}>{p.name}</h3>
                  </div>
                  {isSelected && (
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  )}
                </div>
                <div className={`flex items-center gap-2 mt-2 pt-2 border-t text-xs font-mono ${isSelected ? "border-slate-800 text-slate-300" : "border-slate-200 text-slate-500"}`}>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium ${isSelected ? "bg-slate-800 text-cyan-400" : "bg-white border border-slate-200 text-cyan-700"}`}>
                    {p.taskCount ?? 0}T
                  </span>
                  <span>·</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium ${isSelected ? "bg-slate-800 text-amber-400" : "bg-white border border-slate-200 text-amber-700"}`}>
                    {p.decisionCount ?? 0}D
                  </span>
                  <span className="ml-auto text-[11px] font-sans text-slate-400">Active Sprint</span>
                </div>
              </div>
            );
          })}

          {projects.length === 0 && (
            <p className="text-xs text-slate-400 py-2 text-center">No projects yet. Click + New to create one.</p>
          )}
        </div>

        {/* Nav Items */}
        <nav className="mt-4 space-y-1 text-sm font-medium">
          <a href="#" className="flex items-center justify-between px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition">
            <span className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              All Projects
            </span>
            <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{projects.length}</span>
          </a>

          <a href="#" className="flex items-center justify-between px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition">
            <span className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              Daily Transcripts
            </span>
            <span className="text-xs bg-cyan-100 text-cyan-800 font-semibold px-2 py-0.5 rounded-full">New</span>
          </a>

          <a href="#" className="flex items-center justify-between px-3 py-2 bg-slate-100 text-cyan-900 rounded-lg font-semibold">
            <span className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              Extracted Tasks
            </span>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
              {activeProject?.taskCount ?? 0}
            </span>
          </a>

          <a href="#" className="flex items-center justify-between px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition">
            <span className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              Approvals Log
            </span>
            <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
              {activeProject?.decisionCount ?? 0}
            </span>
          </a>
        </nav>
      </div>

      {/* Quick Metrics Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 text-white shadow-sm border border-slate-700/60 hidden lg:block">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>AI ACCURACY</span>
          <span className="text-emerald-400 font-semibold">99.4%</span>
        </div>
        <div className="mt-2">
          <div className="text-lg font-semibold tracking-tight">18 Items Synced</div>
          <div className="text-xs text-slate-400 mt-1">Automatic extraction from email threads and daily logs.</div>
        </div>
        <div className="mt-3 w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
          <div className="bg-cyan-400 h-full rounded-full" style={{ width: "85%" }}></div>
        </div>
      </div>
    </aside>
  );
}

