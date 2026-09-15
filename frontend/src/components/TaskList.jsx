import { useState } from "react";
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

  if (diffDays < 0)   return { text: "Overdue",               cls: "deadline-overdue" };
  if (diffDays === 0) return { text: "Due today",              cls: "deadline-today"   };
  if (diffDays === 1) return { text: "1 day left",             cls: "deadline-soon"    };
  if (diffDays <= 3)  return { text: `${diffDays} days left`,  cls: "deadline-soon"    };
  if (diffDays <= 7)  return { text: `${diffDays} days left`,  cls: "deadline-week"    };
  const weeks = Math.floor(diffDays / 7);
  if (diffDays < 30)  return { text: weeks === 1 ? "1 week left" : `${weeks} weeks left`, cls: "deadline-ok" };
  return { text: due.toLocaleDateString(), cls: "deadline-ok" };
}

export default function TaskList({ tasks, onStatusChange, onTaskUpdate, onTaskDelete }) {
  const [previewConv,  setPreviewConv]  = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [editTask,     setEditTask]     = useState(null);
  const [toastMsg,     setToastMsg]     = useState("");
  const [deletingId,   setDeletingId]   = useState(null);

  if (!tasks || tasks.length === 0) {
    return (
      <div className="card">
        <h2>Tasks</h2>
        <p className="muted">No tasks extracted yet.</p>
      </div>
    );
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
      <h2>Tasks</h2>
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
          {tasks.map((t) => {
            const dl = getDeadlineLabel(t.deadline);
            return (
              <tr key={t._id} className={deletingId === t._id ? "row-deleting" : ""}>

                {/* Title + notes indicator */}
                <td>
                  <span>{t.title}</span>
                  {t.notes && (
                    <span className="notes-indicator" title={t.notes}>📝</span>
                  )}
                </td>

                {/* Assignee + role badge */}
                <td>
                  <div className="assignee-cell">
                    <span className="assignee-name">{t.assignee}</span>
                    {t.assigneeRole && (
                      <span className="assignee-role-badge">{t.assigneeRole}</span>
                    )}
                  </div>
                </td>

                {/* Deadline + proximity badge */}
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

                {/* Status — quick inline change */}
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

                {/* Action buttons */}
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
