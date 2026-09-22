import { useState, useMemo } from "react";
import { updateTaskStatus, deleteTask } from "../api/client";
import SourcePreviewModal from "./SourcePreviewModal";
import EditTaskModal from "./EditTaskModal";
import ConfidenceIndicator from "./ConfidenceIndicator";

// ── Icons ─────────────────────────────────────────────────────────────────────
const EditIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);
const BellIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);
const EyeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);
const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
  </svg>
);
const XIcon = ({ size = "3.5" }) => (
  <svg className={`w-${size} h-${size}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);
const NotesIcon = () => (
  <svg className="w-3 h-3 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

// ── Deadline label + color (task 5) ───────────────────────────────────────────
// ≤3 days → red  |  ≤7 days → amber/yellow  |  >7 days → blue
const DEADLINE_URGENT = "bg-red-50 text-red-700 border-red-200 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300";
const DEADLINE_SOON   = "bg-amber-50 text-amber-700 border-amber-200 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";
const DEADLINE_LATER  = "bg-blue-50 text-blue-700 border-blue-200 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300";

function getDeadlineLabel(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const due = new Date(deadline);
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDay - nowDay) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)   return { text: "Overdue",           cls: DEADLINE_URGENT };
  if (diffDays === 0) return { text: "Due today",         cls: DEADLINE_URGENT };
  if (diffDays <= 3)  return { text: `${diffDays}d left`, cls: DEADLINE_URGENT };
  if (diffDays <= 7)  return { text: `${diffDays}d left`, cls: DEADLINE_SOON };
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return { text: weeks === 1 ? "1 wk left" : `${weeks} wks left`, cls: DEADLINE_LATER };
  }
  return { text: due.toLocaleDateString(), cls: DEADLINE_LATER };
}

function isOverdue(deadline) {
  if (!deadline) return false;
  const now = new Date();
  const due = new Date(deadline);
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return dueDay < nowDay;
}

function getRoleBadgeStyle(role) {
  if (!role) return "bg-slate-50 text-slate-600 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
  const r = role.toLowerCase();
  if (r.includes("engineer"))  return "bg-sky-50 text-sky-700 border-sky-200 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300";
  if (r.includes("architect")) return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
  if (r.includes("manager"))   return "bg-purple-50 text-purple-700 border-purple-200 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300";
  if (r.includes("client"))    return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300";
  return "bg-slate-50 text-slate-700 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

// ── Inline delete confirmation row (task 3) ───────────────────────────────────
function DeleteConfirmRow({ task, onConfirm, onCancel, loading }) {
  return (
    <tr className="bg-red-50 dark:bg-red-500/10">
      <td colSpan={5} className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm text-red-800 dark:text-red-200">
            <TrashIcon />
            <span>
              Delete <strong className="font-semibold">"{task.title}"</strong>?
              This cannot be undone.
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onCancel}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <XIcon size="3" /> Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
            >
              {loading
                ? <span className="flex items-center gap-1.5"><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Deleting…</span>
                : <><CheckIcon /> Delete</>}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 animate-fade-in whitespace-nowrap pointer-events-none dark:border-slate-600 dark:bg-slate-800">
      <CheckIcon />
      <span>{msg}</span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TaskList({ tasks, onStatusChange, onTaskUpdate, onTaskDelete }) {
  const [previewConv,   setPreviewConv]   = useState(null);
  const [previewTitle,  setPreviewTitle]  = useState("");
  const [editTask,      setEditTask]      = useState(null);
  const [toastMsg,      setToastMsg]      = useState("");
  const [confirmId,     setConfirmId]     = useState(null); // id pending delete confirm
  const [deletingId,    setDeletingId]    = useState(null); // id actively being deleted

  // Filters
  const [filterStatus,   setFilterStatus]   = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterRole,     setFilterRole]     = useState("all");
  const [filterOverdue,  setFilterOverdue]  = useState(false);

  const assigneeOptions = useMemo(() => {
    const set = new Set((tasks || []).map((t) => t.assignee).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [tasks]);

  const roleOptions = useMemo(() => {
    const set = new Set((tasks || []).map((t) => t.assigneeRole).filter(Boolean));
    return set.size > 0 ? ["all", ...Array.from(set).sort()] : null;
  }, [tasks]);

  const filtered = useMemo(() => {
    return (tasks || []).filter((t) => {
      if (filterStatus   !== "all" && t.status        !== filterStatus)   return false;
      if (filterAssignee !== "all" && t.assignee      !== filterAssignee) return false;
      if (filterRole     !== "all" && t.assigneeRole  !== filterRole)     return false;
      if (filterOverdue  && !isOverdue(t.deadline))                       return false;
      return true;
    });
  }, [tasks, filterStatus, filterAssignee, filterRole, filterOverdue]);

  const hasActiveFilter =
    filterStatus !== "all" || filterAssignee !== "all" ||
    filterRole !== "all"   || filterOverdue;

  function clearFilters() {
    setFilterStatus("all"); setFilterAssignee("all");
    setFilterRole("all");   setFilterOverdue(false);
  }

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  }

  async function handleStatusChange(id, status) {
    const updated = await updateTaskStatus(id, status);
    onStatusChange(updated);
  }

  function handleNotify(task) {
    const name = task.assignee !== "Unassigned" ? task.assignee : "Assignee";
    showToast(`${name} notified about "${task.title}"`);
  }

  function handleSaved(updatedTask) {
    onTaskUpdate?.(updatedTask);
    showToast(`"${updatedTask.title}" updated`);
  }

  async function confirmDelete(task) {
    setDeletingId(task._id);
    try {
      await deleteTask(task._id);
      onTaskDelete?.(task._id);
      showToast(`"${task.title}" deleted`);
    } catch {
      showToast("Failed to delete. Please try again.");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">

      {/* Header + filter toolbar */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center gap-3 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Tasks</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {tasks?.length || 0}
          </span>
        </div>

        {tasks?.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto text-xs">

            {/* Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium dark:text-slate-400">Status</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg py-1.5 pl-2.5 pr-6 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium dark:text-slate-400">Assignee</span>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg py-1.5 pl-2.5 pr-6 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {assigneeOptions.map((a) => (
                  <option key={a} value={a}>{a === "all" ? "All" : a}</option>
                ))}
              </select>
            </div>

            {/* Role */}
            {roleOptions && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium dark:text-slate-400">Role</span>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg py-1.5 pl-2.5 pr-6 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{r === "all" ? "All" : r}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Overdue toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-600 font-medium dark:text-slate-300">
              <input
                type="checkbox"
                checked={filterOverdue}
                onChange={(e) => setFilterOverdue(e.target.checked)}
                className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-3.5 w-3.5 cursor-pointer dark:border-slate-600 dark:bg-slate-800"
              />
              Overdue only
            </label>

            {/* Clear filters */}
            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                <XIcon size="3" /> Clear filters
              </button>
            )}

            <span className="text-slate-400 text-xs border-l border-slate-200 pl-2.5 ml-1 dark:border-slate-700 dark:text-slate-500">
              {filtered.length} / {tasks.length}
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
          {hasActiveFilter ? "No tasks match the selected filters." : "No tasks extracted yet."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="py-3 px-4 w-5/12">Task</th>
                <th className="py-3 px-4 w-2/12">Assignee</th>
                <th className="py-3 px-3 w-2/12">Deadline</th>
                <th className="py-3 px-3 w-1/12">Status</th>
                <th className="py-3 px-4 text-right w-1/12">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((task) => {
                const dl = getDeadlineLabel(task.deadline);
                const isThisDeleting = deletingId === task._id;
                const isConfirming   = confirmId  === task._id;

                return [
                  <tr
                    key={task._id}
                    className={`group hover:bg-slate-50/60 transition dark:hover:bg-slate-800/50 ${isThisDeleting || isConfirming ? "opacity-50" : ""}`}
                  >
                    {/* Title */}
                    <td className="py-3 px-4 font-medium text-slate-900 leading-snug dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <span>{task.title}</span>
                        <ConfidenceIndicator confidence={task.confidence} size="sm" />
                        {task.notes && (
                          <span title={task.notes} className="text-slate-400 flex-shrink-0 dark:text-slate-500">
                            <NotesIcon />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Assignee */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{task.assignee || "Unassigned"}</div>
                      {task.assigneeRole && (
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border mt-0.5 ${getRoleBadgeStyle(task.assigneeRole)}`}>
                          {task.assigneeRole}
                        </span>
                      )}
                    </td>

                    {/* Deadline */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-slate-700 font-medium dark:text-slate-300">
                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : "—"}
                      </div>
                      {dl && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${dl.cls}`}>
                          {dl.text}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 transition ${
                          task.status === "done"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-400 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : task.status === "in_progress"
                            ? "bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-400 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
                            : "bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-400 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => setEditTask(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition dark:text-slate-500 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-400"
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleNotify(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition dark:text-slate-500 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
                          title="Notify assignee"
                        >
                          <BellIcon />
                        </button>
                        {task.conversationId && (
                          <button
                            onClick={() => { setPreviewConv(task.conversationId); setPreviewTitle(task.title); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                            title="View source"
                          >
                            <EyeIcon />
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmId(task._id)}
                          disabled={isThisDeleting}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>,

                  // Inline confirm row
                  isConfirming && (
                    <DeleteConfirmRow
                      key={`${task._id}-confirm`}
                      task={task}
                      loading={isThisDeleting}
                      onConfirm={() => confirmDelete(task)}
                      onCancel={() => setConfirmId(null)}
                    />
                  )
                ];
              })}
            </tbody>
          </table>
        </div>
      )}

      {editTask && (
        <EditTaskModal task={editTask} onSaved={handleSaved} onClose={() => setEditTask(null)} />
      )}
      {previewConv && (
        <SourcePreviewModal conversation={previewConv} itemTitle={previewTitle} onClose={() => setPreviewConv(null)} />
      )}
      <Toast msg={toastMsg} />
    </section>
  );
}
