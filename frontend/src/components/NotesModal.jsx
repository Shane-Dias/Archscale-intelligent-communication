import { useRef, useEffect, useState } from "react";

/**
 * NotesModal — shared modal for adding/editing additional notes on a Task or Decision.
 *
 * Props:
 *   itemTitle  – the task title or decision description shown in the header
 *   initialNotes – the current saved notes string (may be empty)
 *   onSave     – async (notes: string) => void  called when the user clicks Save
 *   onClose    – callback to close the modal without saving
 */
export default function NotesModal({ itemTitle, initialNotes = "", onSave, onClose }) {
  const dialogRef = useRef(null);
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

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

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(notes);
      dialogRef.current?.close();
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="source-modal notes-modal"
      onClick={handleBackdropClick}
    >
      <div className="source-modal-inner">
        {/* Header */}
        <div className="source-modal-header">
          <h2>Additional Notes</h2>
          <button
            className="btn-modal-close"
            onClick={() => dialogRef.current.close()}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Context */}
        <p className="source-modal-item-title">
          <strong>Item:</strong> {itemTitle}
        </p>

        {/* Notes textarea */}
        <div className="notes-modal-body">
          <label className="field-label" htmlFor="notes-textarea">
            Notes
          </label>
          <textarea
            id="notes-textarea"
            className="notes-textarea"
            rows={7}
            placeholder="Add any relevant context, links, or follow-up actions…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="notes-modal-actions">
          <button
            className="btn-secondary"
            onClick={() => dialogRef.current.close()}
            disabled={saving}
          >
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Notes"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
