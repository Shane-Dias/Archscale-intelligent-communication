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

  return (
    <aside className="project-sidebar">
      <div className="sidebar-header">
        <h2>Projects</h2>
        <button
          className="btn-new-project"
          onClick={() => setCreating((v) => !v)}
          title="New project"
        >
          {creating ? "×" : "+"}
        </button>
      </div>

      {creating && (
        <form className="new-project-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Project name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <button type="submit">Add</button>
          {error && <p className="error-text">{error}</p>}
        </form>
      )}

      <ul className="project-list">
        {projects.map((p) => (
          <li
            key={p._id}
            className={p._id === selectedId ? "active" : ""}
            onClick={() => onSelect(p._id)}
          >
            <span className="project-name">{p.name}</span>
            <span className="project-counts">
              {p.taskCount ?? 0}T · {p.decisionCount ?? 0}D
            </span>
          </li>
        ))}
        {projects.length === 0 && (
          <li className="muted" style={{ cursor: "default" }}>
            No projects yet
          </li>
        )}
      </ul>
    </aside>
  );
}
