import { useState, useMemo } from "react";
import { updateTaskStatus, deleteTask } from "../api/client";
import SourcePreviewModal from "./SourcePreviewModal";
import EditTaskModal from "./EditTaskModal";

function getDeadlineLabel(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const due = new Date(deadline);
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDay - nowDay) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)   return { text: "Overdue",              cls: "bg-rose-50 text-rose-700 border-rose-200" };
  if (diffDays === 0) return { text: "Due today",             cls: "bg-amber-50 text-amber-700 border-amber-200" };
  if (diffDays === 1) return { text: "1 day left",            cls: "bg-amber-50 text-amber-700 border-amber-200" };
  if (diffDays <= 3)  return { text: `${diffDays} days left`, cls: "bg-amber-50 text-amber-700 border-amber-200" };
  if (diffDays <= 7)  return { text: `${diffDays} days left`, cls: "bg-slate-100 text-slate-700 border-slate-200" };
  const weeks = Math.floor(diffDays / 7);
  if (diffDays < 30)  return { text: weeks === 1 ? "1 week left" : `${weeks} weeks left`, cls: "bg-slate-100 text-slate-700 border-slate-200" };
  return { text: due.toLocaleDateString(), cls: "bg-slate-100 text-slate-700 border-slate-200" };
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
  if (!role) return "bg-slate-50 text-slate-600 border-slate-200";
  const r = role.toLowerCase();
  if (r.includes("engineer")) return "bg-sky-50 text-sky-700 border-sky-200";
  if (r.includes("architect")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (r.includes("manager")) return "bg-purple-50 text-purple-700 border-purple-200";
  if (r.includes("client")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
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

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative" data-purpose="tasks-container">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-3 right-3 z-30 bg-slate-900 text-white text-xs px-3.5 py-2 rounded-lg shadow-lg border border-slate-700 animate-fade-in flex items-center gap-2">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Filter Toolbar */}
      <div className="p-5 border-b border-slate-200 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tasks</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
              {tasks?.length || 0}
            </span>
          </div>

          {/* Filter Toolbar */}
          {tasks?.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md py-1 pl-2.5 pr-7 text-xs font-medium text-slate-700 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              {/* Assignee Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Assignee:</span>
                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md py-1 pl-2.5 pr-7 text-xs font-medium text-slate-700 focus:ring-1 focus:ring-cyan-500"
                >
                  {assigneeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "all" ? "All" : opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Filter */}
              {roleOptions && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Role:</span>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-md py-1 pl-2.5 pr-7 text-xs font-medium text-slate-700 focus:ring-1 focus:ring-cyan-500"
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === "all" ? "All" : opt}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Overdue Only Checkbox */}
              <label className="flex items-center gap-1.5 cursor-pointer ml-1 select-none text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={filterOverdue}
                  onChange={(e) => setFilterOverdue(e.target.checked)}
                  className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 h-3.5 w-3.5"
                />
                <span>Overdue only</span>
              </label>

              {hasActiveFilter && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium ml-1"
                >
                  Clear
                </button>
              )}

              <span className="text-slate-400 font-medium ml-auto border-l border-slate-200 pl-3">
                {filtered.length} of {tasks.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">
          {hasActiveFilter ? "No tasks match the selected filters." : "No extracted tasks available yet."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th scope="col" className="py-3 px-4 font-semibold w-5/12">Task</th>
                <th scope="col" className="py-3 px-4 font-semibold w-2/12">Assignee</th>
                <th scope="col" className="py-3 px-3 font-semibold w-2/12">Deadline</th>
                <th scope="col" className="py-3 px-3 font-semibold w-1.5/12">Status</th>
                <th scope="col" className="py-3 px-4 font-semibold text-right w-1.5/12">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((task) => {
                const deadlineInfo = getDeadlineLabel(task.deadline);
                const isDeleting = deletingId === task._id;

                return (
                  <tr
                    key={task._id}
                    className={`hover:bg-slate-50/80 transition group ${isDeleting ? "opacity-50" : ""}`}
                  >
                    {/* Task Title & Notes */}
                    <td className="py-3.5 px-4 font-medium text-slate-900 leading-snug">
                      <div>{task.title}</div>
                      {task.notes && (
                        <p className="text-[11px] text-slate-400 font-normal mt-0.5">{task.notes}</p>
                      )}
                    </td>

                    {/* Assignee & Role */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{task.assignee || "Unassigned"}</div>
                      {task.assigneeRole && (
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border mt-0.5 ${getRoleBadgeStyle(task.assigneeRole)}`}>
                          {task.assigneeRole}
                        </span>
                      )}
                    </td>

                    {/* Deadline */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="text-slate-700 font-medium">
                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : "—"}
                      </div>
                      {deadlineInfo && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${deadlineInfo.cls}`}>
                          {deadlineInfo.text}
                        </span>
                      )}
                    </td>

                    {/* Status Pill & Select */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none transition ${
                          task.status === "done"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : task.status === "in_progress"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        <option value="pending">pending</option>
                        <option value="in_progress">in_progress</option>
                        <option value="done">done</option>
                      </select>
                    </td>

                    {/* Action Icon Buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 text-slate-400">
                        {/* Edit Button */}
                        <button
                          onClick={() => setEditTask(task)}
                          className="p-1.5 rounded hover:bg-slate-100 hover:text-cyan-600 transition"
                          title="Edit task"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                        </button>

                        {/* Notify Button */}
                        <button
                          onClick={() => handleNotify(task)}
                          className="p-1.5 rounded hover:bg-slate-100 hover:text-amber-600 transition"
                          title="Notify Assignee"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                        </button>

                        {/* View Source Button */}
                        {task.conversationId && (
                          <button
                            onClick={() => {
                              setPreviewConv(task.conversationId);
                              setPreviewTitle(task.title);
                            }}
                            className="p-1.5 rounded hover:bg-slate-100 hover:text-slate-700 transition"
                            title="View Source Conversation"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            </svg>
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(task)}
                          disabled={isDeleting}
                          className="p-1.5 rounded hover:bg-slate-100 hover:text-rose-600 transition"
                          title="Delete Task"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Source Preview Modal */}
      {previewConv && (
        <SourcePreviewModal
          conversation={previewConv}
          itemTitle={previewTitle}
          onClose={() => setPreviewConv(null)}
        />
      )}


      {/* Edit Task Modal */}
      {editTask && (
        <EditTaskModal
          task={editTask}
          onClose={() => setEditTask(null)}
          onSaved={handleSaved}
        />
      )}
    </section>
  );
}
