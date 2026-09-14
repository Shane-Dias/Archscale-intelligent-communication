import { useRef, useEffect } from "react";

/**
 * Modal overlay showing the source conversation for a task / decision.
 * Uses the native <dialog> element for proper accessibility.
 *
 * Props:
 *   conversation  – populated conversationId object
 *                   { source, summary, rawText, participants, createdAt, fileName? }
 *   itemTitle     – the title or description of the task / decision
 *   onClose       – callback to close the modal
 */

const SOURCE_LABELS = {
  manual:              "Manual",
  whatsapp:            "WhatsApp",
  email:               "Email",
  meeting_transcript:  "Meeting Transcript",
  voice_call:          "Voice Call",
  other:               "Other",
};

export default function SourcePreviewModal({ conversation, itemTitle, onClose }) {
  const dialogRef = useRef(null);

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

  if (!conversation) return null;

  // conversation can be a populated object OR a plain string (safety guard)
  if (typeof conversation === "string") {
    return (
      <dialog ref={dialogRef} className="source-modal" onClick={handleBackdropClick}>
        <div className="source-modal-inner">
          <div className="source-modal-header">
            <h2>Source Preview</h2>
            <button className="btn-modal-close" onClick={() => dialogRef.current.close()} aria-label="Close">×</button>
          </div>
          <p className="muted">Source conversation data is not available. Please refresh and try again.</p>
        </div>
      </dialog>
    );
  }

  const date = conversation.createdAt
    ? new Date(conversation.createdAt).toLocaleString()
    : "—";

  const sourceKey = conversation.source || "manual";
  const sourceLabel = SOURCE_LABELS[sourceKey] || sourceKey.replace(/_/g, " ");
  const isFileBased = !!conversation.fileName;

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
          <span className="badge badge-source">{sourceLabel}</span>
          <span className="muted">{date}</span>
          {conversation.participants?.length > 0 && (
            <span className="muted">
              Participants: {conversation.participants.join(", ")}
            </span>
          )}
          {isFileBased && (
            <span className="badge badge-file" title="Extracted from file">
              📎 {conversation.fileName}
            </span>
          )}
        </div>

        {/* Raw text / file note */}
        <div className="source-modal-section">
          <h3>Original Source Text</h3>
          {conversation.rawText ? (
            <pre className="source-modal-raw">{conversation.rawText}</pre>
          ) : (
            <div className="source-modal-file-note">
              <span className="source-modal-file-icon">📄</span>
              <div>
                <p className="source-modal-file-name">{conversation.fileName || "Uploaded file"}</p>
                <p className="muted">
                  Text was extracted from this file and sent to the AI for processing.
                  The original file is not stored on the server.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
