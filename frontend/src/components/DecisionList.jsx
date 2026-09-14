import { useState } from "react";
import SourcePreviewModal from "./SourcePreviewModal";
import NotesModal from "./NotesModal";
import { updateDecisionNotes } from "../api/client";

const TYPE_LABELS = {
  decision: "Decision",
  approval: "Approval",
  pending_approval: "Pending Approval",
};

export default function DecisionList({ decisions, onNotesChange }) {
  const [previewConv, setPreviewConv] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [notesDecision, setNotesDecision] = useState(null);

  if (!decisions || decisions.length === 0) {
    return (
      <div className="card">
        <h2>Decisions & Approvals</h2>
        <p className="muted">No decisions extracted yet.</p>
      </div>
    );
  }

  function openPreview(d) {
    setPreviewConv(d.conversationId);
    setPreviewTitle(d.description);
  }

  async function handleSaveNotes(notes) {
    const updated = await updateDecisionNotes(notesDecision._id, notes);
    onNotesChange?.(updated);
  }

  return (
    <div className="card">
      <h2>Decisions & Approvals</h2>
      <ul className="decision-list">
        {decisions.map((d) => (
          <li key={d._id}>
            <span className={`badge badge-${d.type}`}>
              {TYPE_LABELS[d.type] || d.type}
            </span>
            <span className="decision-desc">
              {d.description}
              {d.notes && (
                <span className="notes-indicator" title={d.notes}>📝</span>
              )}
            </span>
            {d.decidedBy && <span className="muted"> — {d.decidedBy}</span>}
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
            </div>
          </li>
        ))}
      </ul>

      {/* Source preview modal */}
      {previewConv && (
        <SourcePreviewModal
          conversation={previewConv}
          itemTitle={previewTitle}
          onClose={() => setPreviewConv(null)}
        />
      )}

      {/* Notes modal */}
      {notesDecision && (
        <NotesModal
          itemTitle={notesDecision.description}
          initialNotes={notesDecision.notes || ""}
          onSave={handleSaveNotes}
          onClose={() => setNotesDecision(null)}
        />
      )}
    </div>
  );
}
