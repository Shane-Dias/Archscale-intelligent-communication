import { useRef, useEffect } from "react";

/**
 * Modal overlay showing the source conversation for a task / decision.
 * Uses the native <dialog> element for proper accessibility.
 *
 * Props:
 *   conversation  – the populated conversationId object
 *                   { source, summary, rawText, participants, createdAt }
 *   itemTitle     – the title or description of the task / decision
 *   onClose       – callback to close the modal
 */
export default function SourcePreviewModal({ conversation, itemTitle, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    function handleClose() {
      onClose();
    }
    dialog?.addEventListener("close", handleClose);
    return () => dialog?.removeEventListener("close", handleClose);
  }, [onClose]);

  // Close on backdrop click
  function handleBackdropClick(e) {
    if (e.target === dialogRef.current) {
      dialogRef.current.close();
    }
  }

  if (!conversation) return null;

  const date = conversation.createdAt
    ? new Date(conversation.createdAt).toLocaleString()
    : "—";

  const sourceLabel = (conversation.source || "manual").replace(/_/g, " ");

  return (
    <dialog
      ref={dialogRef}
      className="source-modal"
      onClick={handleBackdropClick}
    >
      <div className="source-modal-inner">
        {/* Header */}
        <div className="source-modal-header">
          <h2>Source Preview</h2>
          <button
            className="btn-modal-close"
            onClick={() => dialogRef.current.close()}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Item context */}
        <p className="source-modal-item-title">
          <strong>Item:</strong> {itemTitle}
        </p>

        {/* Summary */}
        <div className="source-modal-section">
          <h3>AI Summary</h3>
          <p>{conversation.summary || <em>No summary available.</em>}</p>
        </div>

        {/* Metadata */}
        <div className="source-modal-meta">
          <span className={`badge badge-source`}>{sourceLabel}</span>
          <span className="muted">{date}</span>
          {conversation.participants?.length > 0 && (
            <span className="muted">
              Participants: {conversation.participants.join(", ")}
            </span>
          )}
        </div>

        {/* Raw text */}
        <div className="source-modal-section">
          <h3>Original Source Text</h3>
          <pre className="source-modal-raw">{conversation.rawText}</pre>
        </div>
      </div>
    </dialog>
  );
}
