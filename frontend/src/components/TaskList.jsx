import { useState, useMemo } from "react";
import { updateTaskStatus, deleteTask } from "../api/client";
import SourcePreviewModal from "./SourcePreviewModal";
import EditTaskModal from "./EditTaskModal";

const STATUS_OPTIONS = ["pending", "in_progress", "done"];

function getDeadlineLabel(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const due = new Date(deadline);
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDay - nowDay) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)   return { text: "Overdue",              cls: "deadline-overdue" };
  if (diffDays === 0) return { text: "Due today",             cls: "deadline-today"   };
  if (diffDays === 1) return { text: "1 day left",            cls: "deadline-soon"    };
  if (diffDays <= 3)  return { text: `${diffDays} days left`, cls: "deadline-soon"    };
  if (diffDays <= 7)  return { text: `${diffDays} days left`, cls: "deadline-week"    };
  const weeks = Math.floor(diffDays / 7);
  if (diffDays < 30)  return { text: weeks === 1 ? "1 week left" : `${weeks} weeks left`, cls: "deadline-ok" };
  return { text: due.toLocaleDateString(), cls: "deadline-ok" };
}

function isOverdue(deadline) {
  if (!deadline) return false;
  const now = new Date();
  const due = new Date(deadline);
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return dueDay < nowDay;
}

export default function TaskList({ tasks, onStatusChange, onTaskUpdate, onTaskDelete }) {
  const [previewConv,  setPreviewConv]  = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [editTask,     setEditTask]     = useState(null);
  const [toastMsg,     setToastMsg]     = useState("");
  const [deletingId,   setDeletingId]   = useState(null);

  // ── filter state ─────────────────────────────────────────────────────────
  const [filterStatus,   setFilterStatus]   = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterRole,     setFilterRole]     = useState("all");
  const [filterOverdue,  setFilterOverdue]  = useState(false);

  // Derive unique assignee and role lists from the full task set
  const assigneeOptions = useMemo(() => {
    const set = new Set((tasks || []).map((t) => t.assignee).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [tasks]);

  const roleOptions = useMemo(() => {
    const set = new Set((tasks || []).map((t) => t.assigneeRole).filter(Boolean));
    return set.size > 0 ? ["all", ...Array.from(set).sort()] : null;
  }, [tasks]);

  // Apply filters
  const filtered = useMemo(() => {
    return (tasks || []).filter((t) => {
      if (filterStatus   !== "all" && t.status   !== filterStatus)   return false;
      if (filterAssignee !== "all" && t.assignee !== filterAssignee) return false;
      if (filterRole     !== "all" && t.assigneeRole !== filterRole) return false;
      if (filterOverdue  && !isOverdue(t.deadline))                  return false;
      return true;
    });
  }, [tasks, filterStatus, filterAssignee, filterRole, filterOverdue]);

  const hasActiveFilter =
    filterStatus !== "all" || filterAssignee !== "all" ||
    filterRole !== "all"   || filterOverdue;

  function clearFilters() {
    setFilterStatus("all");
    setFilterAssignee("all");
    setFilterRole("all");
    setFilterOverdue(false);
  }

  // ── handlers ──────────────────────────────────────────────────────────────
  async function handleStatusChange(id, status) {
    const updated = await updateTaskStatus(id, status);
    onStatusChange(updated);
  }

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  }

  function handleNotify(task) {
    const name = task.assignee !== "Unassigned" ? task.assignee : "Assignee";
    showToast(`✅ ${name} has been notified about "${task.title}"`);
  }

  function handleSaved(updatedTask) {
    onTaskUpdate?.(updatedTask);
    showToast(`✅ "${updatedTask.title}" updated successfully`);
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) return;
    setDeletingId(task._id);
    try {
      await deleteTask(task._id);
      onTaskDelete?.(task._id);
      showToast(`🗑️ "${task.title}" deleted`);
    } catch {
      showToast("Failed to delete task. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="card">
      {/* Card header */}
      <div className="card-header-row">
        <h2>Tasks</h2>
        {tasks?.length > 0 && (
          <span className="card-count-badge">{tasks.length}</span>
        )}
      </div>

      {/* Filter bar */}
      {tasks?.length > 0 && (
        <div className="filter-bar">
          {/* Status */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="tf-status">Status</label>
            <select
              id="tf-status"
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Assignee */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="tf-assignee">Assignee</label>
            <select
              id="tf-assignee"
              className="filter-select"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
            >
              {assigneeOptions.map((a) => (
                <option key={a} value={a}>{a === "all" ? "All" : a}</option>
              ))}
            </select>
          </div>

          {/* Role — only shown if any task has a role */}
          {roleOptions && (
            <div className="filter-group">
              <label className="filter-label" htmlFor="tf-role">Role</label>
              <select
                id="tf-role"
                className="filter-select"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>{r === "all" ? "All" : r}</option>
                ))}
              </select>
            </div>
          )}

          {/* Overdue toggle */}
          <label className="filter-toggle">
            <input
              type="checkbox"
              checked={filterOverdue}
              onChange={(e) => setFilterOverdue(e.target.checked)}
            />
            <span>Overdue only</span>
          </label>

          {/* Clear */}
          {hasActiveFilter && (
            <button className="filter-clear" onClick={clearFilters}>
              ✕ Clear
            </button>
          )}

          {/* Match count */}
          <span className="filter-match-count muted">
            {filtered.length} of {tasks.length}
          </span>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="muted filter-empty">
          {hasActiveFilter
            ? "No tasks match the current filters."
            : "No tasks extracted yet."}
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Assignee</th>
              <th>Deadline</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const dl = getDeadlineLabel(t.deadline);
              return (
                <tr key={t._id} className={deletingId === t._id ? "row-deleting" : ""}>
                  <td>
                    <span>{t.title}</span>
                    {t.notes && (
                      <span className="notes-indicator" title={t.notes}>📝</span>
                    )}
                  </td>
                  <td>
                    <div className="assignee-cell">
                      <span className="assignee-name">{t.assignee}</span>
                      {t.assigneeRole && (
                        <span className="assignee-role-badge">{t.assigneeRole}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="deadline-cell">
                      <span>
                        {t.deadline ? new Date(t.deadline).toLocaleDateString() : "—"}
                      </span>
                      {dl && (
                        <span className={`deadline-badge ${dl.cls}`}>{dl.text}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t._id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.replace("_", " ")}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="action-cell">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => setEditTask(t)}
                        title="Edit task"
                        aria-label="Edit task"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-notify"
                        onClick={() => handleNotify(t)}
                        title="Notify assignee"
                        aria-label="Notify assignee"
                      >
                        🔔
                      </button>
                      {t.conversationId && (
                        <button
                          className="btn-icon"
                          onClick={() => {
                            setPreviewConv(t.conversationId);
                            setPreviewTitle(t.title);
                          }}
                          title="View source"
                          aria-label="View source conversation"
                        >
                          👁
                        </button>
                      )}
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(t)}
                        title="Delete task"
                        aria-label="Delete task"
                        disabled={deletingId === t._id}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {editTask && (
        <EditTaskModal
          task={editTask}
          onSaved={handleSaved}
          onClose={() => setEditTask(null)}
        />
      )}
      {previewConv && (
        <SourcePreviewModal
          conversation={previewConv}
          itemTitle={previewTitle}
          onClose={() => setPreviewConv(null)}
        />
      )}
      {toastMsg && (
        <div className="toast" role="status" aria-live="polite">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
