import { useState } from "react";
import SourcePreviewModal from "./SourcePreviewModal";
import NotesModal from "./NotesModal";
import { updateDecisionNotes, deleteDecision } from "../api/client";

const TYPE_LABELS = {
  decision:         "Decision",
  approval:         "Approval",
  pending_approval: "Pending Approval",
};

export default function DecisionList({ decisions, onNotesChange, onDecisionDelete }) {
  const [previewConv,    setPreviewConv]    = useState(null);
  const [previewTitle,   setPreviewTitle]   = useState("");
  const [notesDecision,  setNotesDecision]  = useState(null);
  const [deletingId,     setDeletingId]     = useState(null);
  const [toastMsg,       setToastMsg]       = useState("");

  if (!decisions || decisions.length === 0) {
    return (
      <div className="card">
        <h2>Decisions & Approvals</h2>
        <p className="muted">No decisions extracted yet.</p>
      </div>
    );
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

  return (
    <div className="card">
      <h2>Decisions & Approvals</h2>
      <ul className="decision-list">
        {decisions.map((d) => (
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
