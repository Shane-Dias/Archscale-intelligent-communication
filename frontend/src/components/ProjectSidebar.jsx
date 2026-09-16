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
      if (!selectedId && data.length > 0) onSelect(data[0]._id);
    } catch {
      // The dashboard handles the no-project state if loading is unavailable.
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    if (!newName.trim()) return;
    setError("");

    try {
      const created = await createProject(newName.trim());
      setProjects((current) => [...current, created]);
      setNewName("");
      setCreating(false);
      onSelect(created._id);
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Failed to create project");
    }
  }

  return (
    <aside className="w-full shrink-0 lg:w-72" data-purpose="sidebar-navigation">
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Projects</span>
          <button
            type="button"
            onClick={() => setCreating((value) => !value)}
            className="inline-flex items-center gap-1 rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700 transition hover:bg-cyan-100 hover:text-cyan-800"
            title="Add new project"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            </svg>
            <span>{creating ? "Cancel" : "New"}</span>
          </button>
        </div>

        {creating && (
          <form onSubmit={handleCreate} className="mb-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <input
              type="text"
              className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="New project name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button type="submit" className="rounded bg-cyan-700 px-3 py-1 text-xs font-semibold text-white transition hover:bg-cyan-800">Add</button>
              <button type="button" onClick={() => setCreating(false)} className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700">Cancel</button>
            </div>
            {error && <p className="mt-1 text-[11px] text-rose-600">{error}</p>}
          </form>
        )}

        <div className="space-y-2.5">
          {projects.map((project) => {
            const isSelected = project._id === selectedId;
            return (
              <button
                key={project._id}
                type="button"
                onClick={() => onSelect(project._id)}
                className={`group relative w-full rounded-lg border p-3.5 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  isSelected
                    ? "border-slate-800 bg-slate-900 text-white hover:border-slate-700"
                    : "border-slate-200/80 bg-slate-50 text-slate-800 hover:bg-slate-100"
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${isSelected ? "bg-emerald-400" : "bg-cyan-500"}`} />
                    <h3 className={`truncate text-sm font-semibold ${isSelected ? "text-white" : "text-slate-900"}`}>{project.name}</h3>
                  </div>
                  {isSelected && (
                    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  )}
                </div>
                <div className={`mt-2 flex items-center gap-2 border-t pt-2 text-xs font-mono ${isSelected ? "border-slate-800 text-slate-300" : "border-slate-200 text-slate-500"}`}>
                  <span className={`rounded px-2 py-0.5 font-medium ${isSelected ? "bg-slate-800 text-cyan-400" : "border border-slate-200 bg-white text-cyan-700"}`}>{project.taskCount ?? 0}T</span>
                  <span className={`rounded px-2 py-0.5 font-medium ${isSelected ? "bg-slate-800 text-amber-400" : "border border-slate-200 bg-white text-amber-700"}`}>{project.decisionCount ?? 0}D</span>
                </div>
              </button>
            );
          })}

          {projects.length === 0 && <p className="py-2 text-center text-xs text-slate-400">No projects yet. Create one to get started.</p>}
        </div>
      </div>
    </aside>
  );
}
