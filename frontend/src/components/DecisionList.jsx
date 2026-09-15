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

  // ── handlers ──────────────────────────────────────────────────────────────
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

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="card">
      {/* Card header */}
      <div className="card-header-row">
        <h2>Decisions & Approvals</h2>
        {decisions?.length > 0 && (
          <span className="card-count-badge">{decisions.length}</span>
        )}
      </div>

      {/* Filter bar */}
      {decisions?.length > 0 && (
        <div className="filter-bar">
          {/* Type */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="df-type">Type</label>
            <select
              id="df-type"
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All</option>
              <option value="decision">Decision</option>
              <option value="approval">Approval</option>
              <option value="pending_approval">Pending Approval</option>
            </select>
          </div>

          {/* Decided by — only shown when there's data */}
          {decidedByOptions && (
            <div className="filter-group">
              <label className="filter-label" htmlFor="df-decidedby">Decided By</label>
              <select
                id="df-decidedby"
                className="filter-select"
                value={filterDecidedBy}
                onChange={(e) => setFilterDecidedBy(e.target.value)}
              >
                {decidedByOptions.map((o) => (
                  <option key={o} value={o}>{o === "all" ? "All" : o}</option>
                ))}
              </select>
            </div>
          )}

          {/* Clear */}
          {hasActiveFilter && (
            <button className="filter-clear" onClick={clearFilters}>
              ✕ Clear
            </button>
          )}

          {/* Match count */}
          <span className="filter-match-count muted">
            {filtered.length} of {decisions.length}
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="muted filter-empty">
          {hasActiveFilter
            ? "No decisions match the current filters."
            : "No decisions extracted yet."}
        </p>
      ) : (
        <ul className="decision-list">
          {filtered.map((d) => (
            <li key={d._id} className={deletingId === d._id ? "row-deleting" : ""}>
              <span className={`badge badge-${d.type}`}>
                {TYPE_LABELS[d.type] || d.type}
              </span>
              <span className="decision-desc">
                {d.description}
                {d.notes && (
                  <span className="notes-indicator" title={d.notes}>📝</span>
                )}
              </span>
              {d.decidedBy && (
                <span className="muted decision-decided-by"> — {d.decidedBy}</span>
              )}
              <div className="decision-actions">
                <button
                  className="btn-icon"
                  onClick={() => setNotesDecision(d)}
                  title={d.notes ? "Edit notes" : "Add notes"}
                  aria-label="Edit notes"
                >
                  📝
                </button>
                {d.conversationId && (
                  <button
                    className="btn-icon"
                    onClick={() => openPreview(d)}
                    title="View source"
                    aria-label="View source conversation"
                  >
                    👁
                  </button>
                )}
                <button
                  className="btn-icon btn-delete"
                  onClick={() => handleDelete(d)}
                  title="Delete"
                  aria-label="Delete decision"
                  disabled={deletingId === d._id}
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {previewConv && (
        <SourcePreviewModal
          conversation={previewConv}
          itemTitle={previewTitle}
          onClose={() => setPreviewConv(null)}
        />
      )}
      {notesDecision && (
        <NotesModal
          itemTitle={notesDecision.description}
          initialNotes={notesDecision.notes || ""}
          onSave={handleSaveNotes}
          onClose={() => setNotesDecision(null)}
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
