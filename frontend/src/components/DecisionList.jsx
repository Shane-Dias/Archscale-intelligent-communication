import { useState, useMemo } from "react";
import SourcePreviewModal from "./SourcePreviewModal";
import NotesModal from "./NotesModal";
import ConfidenceIndicator from "./ConfidenceIndicator";
import { updateDecisionNotes, deleteDecision } from "../api/client";

const TYPE_LABELS = {
  decision:         "Decision",
  approval:         "Approval",
  pending_approval: "Pending Approval",
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const NotesEditIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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
const XIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

// ── Inline delete confirmation (task 3) ───────────────────────────────────────
function DeleteConfirmInline({ item, typeLabel, onConfirm, onCancel, loading }) {
  return (
    <div className="mt-2 flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 dark:border-red-500/30 dark:bg-red-500/10">
      <div className="flex items-center gap-2 text-sm text-red-800 min-w-0 dark:text-red-200">
        <TrashIcon />
        <span className="truncate">Delete this <strong>{typeLabel}</strong>? Cannot be undone.</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onCancel}
          disabled={loading}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <XIcon /> Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
        >
          {loading
            ? <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            : <CheckIcon />}
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 whitespace-nowrap pointer-events-none dark:border-slate-600 dark:bg-slate-800">
      <CheckIcon />
      <span>{msg}</span>
    </div>
  );
}

// ── Badge styles ──────────────────────────────────────────────────────────────
function getBadgeStyle(type) {
  if (type === "pending_approval") return "bg-amber-50 text-amber-800 border-amber-200 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";
  if (type === "approval")         return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
  return "bg-blue-50 text-blue-800 border-blue-200 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DecisionList({ decisions, onNotesChange, onDecisionDelete }) {
  const [previewConv,   setPreviewConv]   = useState(null);
  const [previewTitle,  setPreviewTitle]  = useState("");
  const [notesDecision, setNotesDecision] = useState(null);
  const [confirmId,     setConfirmId]     = useState(null);
  const [deletingId,    setDeletingId]    = useState(null);
  const [toastMsg,      setToastMsg]      = useState("");

  // Filters
  const [filterType,      setFilterType]      = useState("all");
  const [filterDecidedBy, setFilterDecidedBy] = useState("all");

  const decidedByOptions = useMemo(() => {
    const set = new Set((decisions || []).map((d) => d.decidedBy).filter(Boolean));
    return set.size > 0 ? ["all", ...Array.from(set).sort()] : null;
  }, [decisions]);

  const filtered = useMemo(() =>
    (decisions || []).filter((d) => {
      if (filterType      !== "all" && d.type      !== filterType)      return false;
      if (filterDecidedBy !== "all" && d.decidedBy !== filterDecidedBy) return false;
      return true;
    }),
  [decisions, filterType, filterDecidedBy]);

  const hasActiveFilter = filterType !== "all" || filterDecidedBy !== "all";

  function clearFilters() { setFilterType("all"); setFilterDecidedBy("all"); }

  function showToast(msg) { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); }

  async function handleSaveNotes(notes) {
    const updated = await updateDecisionNotes(notesDecision._id, notes);
    onNotesChange?.(updated);
    showToast("Notes saved");
  }

  async function confirmDelete(d) {
    setDeletingId(d._id);
    try {
      await deleteDecision(d._id);
      onDecisionDelete?.(d._id);
      showToast(`${TYPE_LABELS[d.type] || "Item"} deleted`);
    } catch {
      showToast("Failed to delete. Please try again.");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">

      {/* Header + filters */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Decisions & Approvals</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {decisions?.length || 0}
          </span>
        </div>

        {decisions?.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto text-xs">
            {/* Type filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium dark:text-slate-400">Type</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg py-1.5 pl-2.5 pr-6 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">All</option>
                <option value="decision">Decision</option>
                <option value="approval">Approval</option>
                <option value="pending_approval">Pending Approval</option>
              </select>
            </div>

            {/* Decided by filter */}
            {decidedByOptions && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium dark:text-slate-400">Decided By</span>
                <select
                  value={filterDecidedBy}
                  onChange={(e) => setFilterDecidedBy(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg py-1.5 pl-2.5 pr-6 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {decidedByOptions.map((o) => (
                    <option key={o} value={o}>{o === "all" ? "All" : o}</option>
                  ))}
                </select>
              </div>
            )}

            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                <XIcon /> Clear
              </button>
            )}

            <span className="text-slate-400 border-l border-slate-200 pl-2.5 dark:border-slate-700 dark:text-slate-500">
              {filtered.length} / {decisions.length}
            </span>
          </div>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
          {hasActiveFilter ? "No decisions match the current filters." : "No decisions extracted yet."}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((d) => {
            const isDeleting   = deletingId === d._id;
            const isConfirming = confirmId  === d._id;

            return (
              <div
                key={d._id}
                className={`px-5 py-4 hover:bg-slate-50/60 transition dark:hover:bg-slate-800/50 ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: badge + indicator + text */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getBadgeStyle(d.type)}`}>
                        {TYPE_LABELS[d.type] || d.type}
                      </span>
                      <ConfidenceIndicator confidence={d.confidence} size="sm" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 leading-snug dark:text-slate-100">{d.description}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 flex-wrap dark:text-slate-400">
                        {d.decidedBy && (
                          <span className="font-medium text-slate-700 dark:text-slate-300">— {d.decidedBy}</span>
                        )}
                        {d.notes && (
                          <span className="flex items-center gap-1 text-cyan-700 dark:text-cyan-400">
                            <NotesEditIcon />
                            Notes attached
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: action buttons */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => setNotesDecision(d)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition dark:text-slate-500 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-400"
                      title={d.notes ? "Edit notes" : "Add notes"}
                    >
                      <NotesEditIcon />
                    </button>
                    {d.conversationId && (
                      <button
                        onClick={() => { setPreviewConv(d.conversationId); setPreviewTitle(d.description); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                        title="View source"
                      >
                        <EyeIcon />
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmId(d._id)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      title="Delete"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                {/* Inline delete confirmation */}
                {isConfirming && (
                  <DeleteConfirmInline
                    item={d}
                    typeLabel={TYPE_LABELS[d.type] || "item"}
                    loading={isDeleting}
                    onConfirm={() => confirmDelete(d)}
                    onCancel={() => setConfirmId(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {previewConv && (
        <SourcePreviewModal conversation={previewConv} itemTitle={previewTitle} onClose={() => setPreviewConv(null)} />
      )}
      {notesDecision && (
        <NotesModal
          itemTitle={notesDecision.description}
          initialNotes={notesDecision.notes || ""}
          onSave={handleSaveNotes}
          onClose={() => setNotesDecision(null)}
        />
      )}
      <Toast msg={toastMsg} />
    </section>
  );
}
