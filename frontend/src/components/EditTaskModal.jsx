import { useRef, useEffect, useState } from "react";
import { updateTask } from "../api/client";

const STATUS_OPTIONS = [
  { value: "pending",     label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "done",        label: "Done" },
];

/**
 * EditTaskModal — lets the user edit every field of a task in one place.
 *
 * Props:
 *   task      – the full task object to edit
 *   onSaved   – (updatedTask) => void  called after a successful save
 *   onClose   – () => void  called when the modal closes without saving
 */
export default function EditTaskModal({ task, onSaved, onClose }) {
  const dialogRef = useRef(null);

  const [title,        setTitle]        = useState(task.title        || "");
  const [assignee,     setAssignee]     = useState(task.assignee     || "");
  const [assigneeRole, setAssigneeRole] = useState(task.assigneeRole || "");
  const [deadline,     setDeadline]     = useState(
    task.deadline ? toDateInputValue(task.deadline) : ""
  );
  const [status,  setStatus]  = useState(task.status || "pending");
  const [notes,   setNotes]   = useState(task.notes  || "");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  // ── dialog lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    function handleClose() { onClose(); }
    dialog?.addEventListener("close", handleClose);
    return () => dialog?.removeEventListener("close", handleClose);
  }, [onClose]);

  function handleBackdropClick(e) {
    if (e.target === dialogRef.current) dialogRef.current.close();
  }

  // ── save ──────────────────────────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    if (!title.trim()) { setError("Task title cannot be empty."); return; }

    setSaving(true);
    setError("");
    try {
      const updated = await updateTask(task._id, {
        title:        title.trim(),
        assignee:     assignee.trim() || "Unassigned",
        assigneeRole: assigneeRole.trim(),
        deadline:     deadline || null,
        status,
        notes,
      });
      onSaved(updated);
      dialogRef.current?.close();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <dialog
      ref={dialogRef}
      className="source-modal edit-task-modal"
      onClick={handleBackdropClick}
    >
      <form className="source-modal-inner" onSubmit={handleSave} noValidate>

        {/* Header */}
        <div className="source-modal-header">
          <h2>Edit Task</h2>
          <button
            type="button"
            className="btn-modal-close"
            onClick={() => dialogRef.current.close()}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="edit-task-fields">

          {/* Title */}
          <div className="edit-task-field">
            <label className="field-label" htmlFor="et-title">Task Title</label>
            <input
              id="et-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Describe the task…"
              required
            />
          </div>

          {/* Assignee + Role — side by side */}
          <div className="edit-task-row">
            <div className="edit-task-field">
              <label className="field-label" htmlFor="et-assignee">Assignee</label>
              <input
                id="et-assignee"
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Name or leave blank"
              />
            </div>
            <div className="edit-task-field">
              <label className="field-label" htmlFor="et-role">
                Role
                <span className="field-hint"> — e.g. Architect, Dev Lead</span>
              </label>
              <input
                id="et-role"
                type="text"
                value={assigneeRole}
                onChange={(e) => setAssigneeRole(e.target.value)}
                placeholder="Optional role or title"
              />
            </div>
          </div>

          {/* Deadline + Status — side by side */}
          <div className="edit-task-row">
            <div className="edit-task-field">
              <label className="field-label" htmlFor="et-deadline">
                Deadline
                <span className="field-hint"> — blank to clear</span>
              </label>
              <input
                id="et-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="edit-task-field">
              <label className="field-label" htmlFor="et-status">Status</label>
              <select
                id="et-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="edit-task-field">
            <label className="field-label" htmlFor="et-notes">Additional Notes</label>
            <textarea
              id="et-notes"
              className="notes-textarea"
              rows={4}
              placeholder="Any extra context, links, or follow-up actions…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="notes-modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => dialogRef.current.close()}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" disabled={saving || !title.trim()}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>

      </form>
    </dialog>
  );
}

function toDateInputValue(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
