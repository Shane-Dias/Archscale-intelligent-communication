import { useRef, useEffect } from "react";
import useLockBodyScroll from "../hooks/useLockBodyScroll";

const SOURCE_LABELS = {
  manual:             "Manual",
  whatsapp:           "WhatsApp",
  email:              "Email",
  meeting_transcript: "Meeting Transcript",
  voice_call:         "Voice Call",
  other:              "Other",
};

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

const PaperclipIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
      strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

const FileTextIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
  </svg>
);

export default function SourcePreviewModal({ conversation, itemTitle, onClose }) {
  const dialogRef = useRef(null);

  useLockBodyScroll();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      try { dialog.showModal(); } catch { /* ignore */ }
    }
    function handleClose() { onClose(); }
    dialog?.addEventListener("close", handleClose);
    return () => dialog?.removeEventListener("close", handleClose);
  }, [onClose]);

  function handleBackdropClick(e) {
    if (e.target === dialogRef.current) {
      dialogRef.current?.open ? dialogRef.current.close() : onClose();
    }
  }

  if (!conversation) return null;

  // Safety guard — bare string ID
  if (typeof conversation === "string") {
    return (
      <dialog ref={dialogRef} onClick={handleBackdropClick}
        className="rounded-2xl border border-slate-200 bg-white shadow-2xl p-0 w-[90vw] max-w-xl backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Source Preview</h2>
          <button onClick={() => dialogRef.current?.close()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200">
            <XIcon />
          </button>
        </div>
        <p className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
          Source conversation data is not available. Please refresh and try again.
        </p>
      </dialog>
    );
  }

  const date = conversation.createdAt ? new Date(conversation.createdAt).toLocaleString() : "—";
  const sourceLabel = SOURCE_LABELS[conversation.source || "manual"] || (conversation.source || "").replace(/_/g, " ");
  const isFileBased = !!conversation.fileName;

  return (
    <dialog ref={dialogRef} onClick={handleBackdropClick}
      className="rounded-2xl border border-slate-200 bg-white shadow-2xl p-0 w-[90vw] max-w-2xl backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Source Conversation</h2>
          </div>
          <button onClick={() => dialogRef.current?.close()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200" aria-label="Close">
            <XIcon />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="px-6 py-5 flex flex-col gap-5">

            {/* Referenced item */}
            {itemTitle && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 dark:text-slate-500">Referenced Item</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{itemTitle}</p>
              </div>
            )}

            {/* AI Summary */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 dark:text-slate-500">AI Summary</h3>
              <p className="text-sm text-slate-700 bg-cyan-50 border border-cyan-100 px-4 py-3 rounded-xl leading-relaxed dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-slate-200">
                {conversation.summary || "No summary recorded for this item."}
              </p>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {sourceLabel}
              </span>
              <span className="text-slate-400 text-[11px] dark:text-slate-500">{date}</span>
              {conversation.participants?.length > 0 && (
                <span className="text-slate-500 text-[11px] dark:text-slate-400">
                  Participants: <strong className="text-slate-700 dark:text-slate-200">{conversation.participants.join(", ")}</strong>
                </span>
              )}
              {isFileBased && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                  <PaperclipIcon />
                  {conversation.fileName}
                </span>
              )}
            </div>

            {/* Raw text / file note */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 dark:text-slate-500">Original Source Text</h3>
              {conversation.rawText ? (
                <pre className="text-xs font-mono bg-slate-900 text-slate-200 px-4 py-4 rounded-xl max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed dark:border dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  {conversation.rawText}
                </pre>
              ) : (
                <div className="flex items-center gap-3.5 px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl dark:border-slate-700 dark:bg-slate-800/60">
                  <div className="text-slate-400 flex-shrink-0 dark:text-slate-500"><FileTextIcon /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{conversation.fileName || "Uploaded File"}</p>
                    <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">
                      Text was extracted from this file and processed by the AI.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </dialog>
  );
}
