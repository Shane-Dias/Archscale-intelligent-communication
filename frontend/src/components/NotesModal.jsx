import { useRef, useEffect, useState } from "react";

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

export default function NotesModal({ itemTitle, initialNotes = "", onSave, onClose }) {
  const dialogRef = useRef(null);
  const [notes,  setNotes]  = useState(initialNotes);
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
      onClick={handleBackdropClick}
      className="rounded-2xl border border-slate-200 bg-white shadow-2xl p-0 w-[90vw] max-w-lg backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Additional Notes</h2>
          <button
            onClick={() => dialogRef.current.close()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        {/* Context */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Item: </span>{itemTitle}
          </p>
        </div>

        {/* Notes field */}
        <div className="px-6 py-5">
          <label className="block text-xs font-semibold text-slate-600 mb-2" htmlFor="notes-textarea">
            Notes
          </label>
          <textarea
            id="notes-textarea"
            rows={7}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any relevant context, links, or follow-up actions…"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-y transition font-sans leading-relaxed"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100">
          <button
            onClick={() => dialogRef.current.close()}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Notes"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
