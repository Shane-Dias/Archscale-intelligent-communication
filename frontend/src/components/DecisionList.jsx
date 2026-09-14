import { useState } from "react";
import SourcePreviewModal from "./SourcePreviewModal";

const TYPE_LABELS = {
  decision: "Decision",
  approval: "Approval",
  pending_approval: "Pending Approval",
};

export default function DecisionList({ decisions }) {
  const [previewConv, setPreviewConv] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");

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

  return (
    <div className="card">
      <h2>Decisions & Approvals</h2>
      <ul className="decision-list">
        {decisions.map((d) => (
          <li key={d._id}>
            <span className={`badge badge-${d.type}`}>
              {TYPE_LABELS[d.type] || d.type}
            </span>
            <span>{d.description}</span>
            {d.decidedBy && <span className="muted"> — {d.decidedBy}</span>}
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
    </div>
  );
}
