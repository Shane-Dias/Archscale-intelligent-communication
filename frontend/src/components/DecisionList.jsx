import { useState, useMemo } from "react";
import SourcePreviewModal from "./SourcePreviewModal";
import NotesModal from "./NotesModal";
import { updateDecisionNotes, deleteDecision } from "../api/client";

const TYPE_LABELS = {
  decision:         "Decision",
  approval:         "Approval",
  pending_approval: "Pending Approval",
};

export default function DecisionList({ decisions, onNotesChange, onDecisionDelete }) {
  const [previewConv,   setPreviewConv]   = useState(null);
  const [previewTitle,  setPreviewTitle]  = useState("");
  const [notesDecision, setNotesDecision] = useState(null);
  const [deletingId,    setDeletingId]    = useState(null);
  const [toastMsg,      setToastMsg]      = useState("");

  // ── filter state ─────────────────────────────────────────────────────────
  const [filterType,      setFilterType]      = useState("all");
  const [filterDecidedBy, setFilterDecidedBy] = useState("all");

  const decidedByOptions = useMemo(() => {
    const set = new Set((decisions || []).map((d) => d.decidedBy).filter(Boolean));
    return set.size > 0 ? ["all", ...Array.from(set).sort()] : null;
  }, [decisions]);

  const filtered = useMemo(() => {
    return (decisions || []).filter((d) => {
      if (filterType      !== "all" && d.type      !== filterType)      return false;
      if (filterDecidedBy !== "all" && d.decidedBy !== filterDecidedBy) return false;
      return true;
    });
  }, [decisions, filterType, filterDecidedBy]);

  const hasActiveFilter = filterType !== "all" || filterDecidedBy !== "all";

  function clearFilters() {
    setFilterType("all");
    setFilterDecidedBy("all");
  }

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  }

  function openPreview(d) {
    setPreviewConv(d.conversationId);
    setPreviewTitle(d.description);
  }

  async function handleSaveNotes(notes) {
    const updated = await updateDecisionNotes(notesDecision._id, notes);
    onNotesChange?.(updated);
    showToast("✅ Notes saved successfully");
  }

  async function handleDelete(d) {
    if (!window.confirm(`Delete this ${TYPE_LABELS[d.type] || "item"}?\n\n"${d.description}"\n\nThis cannot be undone.`)) return;
    setDeletingId(d._id);
    try {
      await deleteDecision(d._id);
      onDecisionDelete?.(d._id);
      showToast(`🗑️ ${TYPE_LABELS[d.type] || "Item"} deleted`);
    } catch {
      showToast("Failed to delete. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  function getBadgeStyle(type) {
    if (type === "pending_approval") return "bg-amber-50 text-amber-800 border-amber-200/80";
    if (type === "approval") return "bg-emerald-50 text-emerald-800 border-emerald-200/80";
    return "bg-sky-50 text-sky-800 border-sky-200/80";
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative" data-purpose="decisions-container">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-3 right-3 z-30 bg-slate-900 text-white text-xs px-3.5 py-2 rounded-lg shadow-lg border border-slate-700 animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header with Filter Controls */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Decisions & Approvals</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
              {decisions?.length || 0}
            </span>
          </div>

          {/* Decisions Filter Toolbar */}
          {decisions?.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Type:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md py-1 pl-2.5 pr-7 text-xs font-medium text-slate-700 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="all">All</option>
                  <option value="decision">Decision</option>
                  <option value="approval">Approval</option>
                  <option value="pending_approval">Pending Approval</option>
                </select>
              </div>

              {decidedByOptions && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Decided By:</span>
                  <select
                    value={filterDecidedBy}
                    onChange={(e) => setFilterDecidedBy(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-md py-1 pl-2.5 pr-7 text-xs font-medium text-slate-700 focus:ring-1 focus:ring-cyan-500"
                  >
                    {decidedByOptions.map((o) => (
                      <option key={o} value={o}>{o === "all" ? "All" : o}</option>
                    ))}
                  </select>
                </div>
              )}

              {hasActiveFilter && (
                <button onClick={clearFilters} className="text-xs text-rose-600 hover:text-rose-800 font-medium">
                  Clear
                </button>
              )}

              <span className="text-slate-400 font-medium border-l border-slate-200 pl-3">
                {filtered.length} of {decisions.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Decisions Structured List */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">
          {hasActiveFilter ? "No decisions match the current filters." : "No decisions extracted yet."}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map((d) => {
            const isDeleting = deletingId === d._id;

            return (
              <div
                key={d._id}
                className={`p-4 sm:p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isDeleting ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Badge */}
                  <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border mt-0.5 ${getBadgeStyle(d.type)}`}>
                    {TYPE_LABELS[d.type] || d.type}
                  </span>

                  <div>
                    <p className="text-xs font-medium text-slate-900 leading-relaxed">
                      {d.description}
                    </p>

                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      {d.decidedBy && (
                        <>
                          <span className="font-medium text-slate-700">— {d.decidedBy}</span>
                          <span className="text-slate-300">·</span>
                        </>
                      )}
                      {d.notes ? (
                        <span className="text-cyan-700 font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                          Notes attached
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans">No extra notes</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Icon Buttons */}
                <div className="flex items-center gap-1.5 self-end md:self-center text-slate-400">
                  {/* Edit Notes Button */}
                  <button
                    onClick={() => setNotesDecision(d)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 hover:text-cyan-600 transition"
                    title="Edit Notes"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </button>

                  {/* View Source Preview Button */}
                  {d.conversationId && (
                    <button
                      onClick={() => openPreview(d)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 hover:text-slate-700 transition"
                      title="Preview Source Conversation"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(d)}
                    disabled={isDeleting}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 hover:text-rose-600 transition"
                    title="Delete Decision"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
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


      {/* Notes Modal */}
      {notesDecision && (
        <NotesModal
          decision={notesDecision}
          onClose={() => setNotesDecision(null)}
          onSave={handleSaveNotes}
        />
      )}
    </section>
  );
}

