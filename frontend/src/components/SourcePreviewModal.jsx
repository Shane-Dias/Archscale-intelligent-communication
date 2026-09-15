import { useRef, useEffect } from "react";

const SOURCE_LABELS = {
  manual:              "Manual",
  whatsapp:            "WhatsApp",
  email:               "Email Sync",
  meeting_transcript:  "Meeting Transcript",
  voice_call:          "Voice Call",
  other:               "Other",
};

export default function SourcePreviewModal({ conversation, itemTitle, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        // Fallback for browsers
      }
    }

    function handleClose() {
      onClose();
    }
    dialog?.addEventListener("close", handleClose);
    return () => dialog?.removeEventListener("close", handleClose);
  }, [onClose]);

  function handleBackdropClick(e) {
    if (e.target === dialogRef.current) {
      if (dialogRef.current?.open) dialogRef.current.close();
      else onClose();
    }
  }

  if (!conversation) return null;

  // Handle case where conversation is string ID fallback
  if (typeof conversation === "string") {
    return (
      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        className="fixed inset-0 m-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-xl w-full backdrop:bg-slate-900/60 backdrop:backdrop-blur-xs z-50"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Source Preview</h2>
          <button
            onClick={() => dialogRef.current?.close()}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-4">Source conversation details loading or unavailable.</p>
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
      onClick={handleBackdropClick}
      className="fixed inset-0 m-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-2xl w-[90vw] backdrop:bg-slate-900/60 backdrop:backdrop-blur-xs z-50"
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            <h2 className="text-base font-bold text-slate-900">Source Conversation Preview</h2>
          </div>
          <button
            onClick={() => dialogRef.current?.close()}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Item title */}
        {itemTitle && (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <span className="text-[11px] font-bold uppercase text-slate-400 block mb-0.5">Referenced Item</span>
            <p className="text-xs font-semibold text-slate-900">{itemTitle}</p>
          </div>
        )}

        {/* AI Summary */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">AI Summary</h3>
          <p className="text-xs text-slate-700 bg-cyan-50/50 border border-cyan-100 p-3 rounded-lg leading-relaxed">
            {conversation.summary || "No summary recorded for this item."}
          </p>
        </div>

        {/* Metadata Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
            {sourceLabel}
          </span>
          <span className="text-slate-400 text-[11px]">{date}</span>
          {conversation.participants?.length > 0 && (
            <span className="text-slate-500 text-[11px]">
              Participants: <strong className="text-slate-700">{conversation.participants.join(", ")}</strong>
            </span>
          )}
          {isFileBased && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
              📎 {conversation.fileName}
            </span>
          )}
        </div>

        {/* Raw Text / Extract Details */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Original Source Text</h3>
          {conversation.rawText ? (
            <pre className="text-xs font-mono bg-slate-900 text-slate-200 p-4 rounded-xl max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
              {conversation.rawText}
            </pre>
          ) : (
            <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <span className="text-xl">📄</span>
              <div>
                <p className="font-semibold text-slate-800">{conversation.fileName || "Uploaded File"}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Extracted directly from document content for AI processing.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

