import { useState } from "react";
import { updateTaskStatus, updateTaskNotes } from "../api/client";
import SourcePreviewModal from "./SourcePreviewModal";
import NotesModal from "./NotesModal";

const STATUS_OPTIONS = ["pending", "in_progress", "done"];

/**
 * Returns a human-readable deadline proximity label and a severity class.
 * e.g. "Due today", "3 days left", "1 week left", "Overdue"
 */
function getDeadlineLabel(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const due = new Date(deadline);
  // Compare calendar days, ignoring time
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffMs = dueDay - nowDay;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: "Overdue", cls: "deadline-overdue" };
  if (diffDays === 0) return { text: "Due today", cls: "deadline-today" };
  if (diffDays === 1) return { text: "1 day left", cls: "deadline-soon" };
  if (diffDays <= 3) return { text: `${diffDays} days left`, cls: "deadline-soon" };
  if (diffDays <= 7) return { text: `${diffDays} days left`, cls: "deadline-week" };
  const weeks = Math.floor(diffDays / 7);
  if (diffDays < 30) return { text: weeks === 1 ? "1 week left" : `${weeks} weeks left`, cls: "deadline-ok" };
  return { text: due.toLocaleDateString(), cls: "deadline-ok" };
}

export default function TaskList({ tasks, onStatusChange, onNotesChange }) {
  const [previewConv, setPreviewConv] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [notesTask, setNotesTask] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  if (!tasks || tasks.length === 0) {
    return (
      <div className="card">
        <h2>Tasks</h2>
        <p className="muted">No tasks extracted yet.</p>
      </div>
    );
  }

  async function handleStatusChange(id, status) {
    const updated = await updateTaskStatus(id, status);
    onStatusChange(updated);
  }

  function openPreview(task) {
    setPreviewConv(task.conversationId);
    setPreviewTitle(task.title);
  }

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  }

  function handleNotify(task) {
    showToast(`✅ ${task.assignee !== "Unassigned" ? task.assignee : "Assignee"} has been notified about "${task.title}"`);
  }

  async function handleSaveNotes(notes) {
    const updated = await updateTaskNotes(notesTask._id, notes);
    onNotesChange?.(updated);
  }

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
              <tr key={t._id}>
                <td>
                  <span>{t.title}</span>
                  {t.notes && (
                    <span className="notes-indicator" title={t.notes}>📝</span>
                  )}
                </td>
                <td>{t.assignee}</td>
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
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="action-cell">
                    <button
                      className="btn-icon btn-notify"
                      onClick={() => handleNotify(t)}
                      title="Notify assignee"
                      aria-label="Notify assignee"
                    >
                      🔔
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => setNotesTask(t)}
                      title={t.notes ? "Edit notes" : "Add notes"}
                      aria-label="Edit notes"
                    >
                      📝
                    </button>
                    {t.conversationId && (
                      <button
                        className="btn-icon"
                        onClick={() => openPreview(t)}
                        title="View source"
                        aria-label="View source conversation"
                      >
                        👁
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Source preview modal */}
      {previewConv && (
        <SourcePreviewModal
          conversation={previewConv}
          itemTitle={previewTitle}
          onClose={() => setPreviewConv(null)}
        />
      )}

      {/* Notes modal */}
      {notesTask && (
        <NotesModal
          itemTitle={notesTask.title}
          initialNotes={notesTask.notes || ""}
          onSave={handleSaveNotes}
          onClose={() => setNotesTask(null)}
        />
      )}

      {/* Notify toast */}
      {toastMsg && (
        <div className="toast" role="status" aria-live="polite">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
