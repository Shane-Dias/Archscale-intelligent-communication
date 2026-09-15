import { useRef, useEffect, useState } from "react";
import { updateTask } from "../api/client";

const STATUS_OPTIONS = [
  { value: "pending",     label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "done",        label: "Done" },
];

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

function toDateInputValue(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function EditTaskModal({ task, onSaved, onClose }) {
  const dialogRef = useRef(null);

  const [title,        setTitle]        = useState(task.title        || "");
  const [assignee,     setAssignee]     = useState(task.assignee     || "");
  const [assigneeRole, setAssigneeRole] = useState(task.assigneeRole || "");
  const [deadline,     setDeadline]     = useState(task.deadline ? toDateInputValue(task.deadline) : "");
  const [status,       setStatus]       = useState(task.status       || "pending");
  const [notes,        setNotes]        = useState(task.notes        || "");
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");

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

  const inputCls = "w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="rounded-2xl border border-slate-200 bg-white shadow-2xl p-0 w-[90vw] max-w-lg backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSave} noValidate className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Edit Task</h2>
          <button type="button" onClick={() => dialogRef.current.close()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition" aria-label="Close">
            <XIcon />
          </button>
        </div>

        {/* Fields */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Title */}
          <div>
            <label className={labelCls} htmlFor="et-title">Task Title</label>
            <input id="et-title" type="text" value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Describe the task…" required className={inputCls} />
          </div>

          {/* Assignee + Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="et-assignee">Assignee</label>
              <input id="et-assignee" type="text" value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Name or leave blank" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="et-role">
                Role <span className="font-normal text-slate-400">— optional</span>
              </label>
              <input id="et-role" type="text" value={assigneeRole}
                onChange={(e) => setAssigneeRole(e.target.value)}
                placeholder="e.g. Architect, Dev Lead" className={inputCls} />
            </div>
          </div>

          {/* Deadline + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="et-deadline">
                Deadline <span className="font-normal text-slate-400">— blank to clear</span>
              </label>
              <input id="et-deadline" type="date" value={deadline}
                onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="et-status">Status</label>
              <select id="et-status" value={status} onChange={(e) => setStatus(e.target.value)}
                className={inputCls}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls} htmlFor="et-notes">Additional Notes</label>
            <textarea id="et-notes" rows={4} value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra context, links, or follow-up actions…"
              className={`${inputCls} resize-y leading-relaxed`} />
          </div>

        </div>

        {error && (
          <p className="px-6 pb-2 text-xs text-red-600">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100">
          <button type="button" onClick={() => dialogRef.current.close()} disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={saving || !title.trim()}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
