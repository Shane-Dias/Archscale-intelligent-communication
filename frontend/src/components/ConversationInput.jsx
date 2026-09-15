import { useState, useRef } from "react";
import { extractFromText, extractFromFile } from "../api/client";

const SOURCES = [
  { value: "manual",             label: "Manual" },
  { value: "email",              label: "Email Sync (Outlook/Gmail)" },
  { value: "whatsapp",           label: "WhatsApp Site Notes" },
  { value: "meeting_transcript", label: "Meeting Transcript (Otter / Teams)" },
  { value: "voice_call",         label: "Voice Call" },
  { value: "other",              label: "Other" },
];

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.doc,.txt,.csv,.md,.text";
const ACCEPTED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/csv",
  "text/markdown",
];

export default function ConversationInput({ projectId, onExtracted }) {
  const [tab, setTab]           = useState("text"); // "text" | "file"
  const [source, setSource]     = useState("manual");
  const [text, setText]         = useState("");
  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const fileInputRef = useRef(null);

  function isValidFile(f) {
    if (!f) return false;
    const ext = f.name.split(".").pop().toLowerCase();
    const validExts = new Set(["pdf","docx","doc","txt","csv","md","text"]);
    return ACCEPTED_MIME.includes(f.type) || validExts.has(ext);
  }

  function pickFile(f) {
    if (!isValidFile(f)) {
      setError("Unsupported file type. Please upload a PDF, DOCX, TXT, CSV, or Markdown file.");
      return;
    }
    setError("");
    setFile(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) pickFile(dropped);
  }

  function handleDragOver(e) { e.preventDefault(); setDragging(true); }
  function handleDragLeave()  { setDragging(false); }

  function handleFileInput(e) {
    const picked = e.target.files[0];
    if (picked) pickFile(picked);
    e.target.value = "";
  }

  function removeFile() { setFile(null); setError(""); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!projectId) return;

    const isText = tab === "text";
    if (isText && !text.trim()) return;
    if (!isText && !file) return;

    setLoading(true);
    setError("");
    try {
      let result;
      if (isText) {
        result = await extractFromText(text, source, projectId);
      } else {
        result = await extractFromFile(file, source, projectId);
      }
      onExtracted(result);
      setText("");
      setFile(null);
    } catch (err) {
      setError(
        err?.response?.data?.error || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !loading && !!projectId && (tab === "text" ? !!text.trim() : !!file);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6" data-purpose="ingestion-card">
      {/* Card Header & Source Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Add a Conversation</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200">
              AI Parser
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Ingest communications to automatically extract action items, deadlines, and approvals.</p>
        </div>

        {/* Source Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 whitespace-nowrap" htmlFor="conversation-source">Source:</label>
          <select
            id="conversation-source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Mode Tab Buttons */}
        <div className="mt-4 flex items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setTab("text"); setError(""); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                tab === "text"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg className={`w-3.5 h-3.5 ${tab === "text" ? "text-cyan-600" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span>Paste Text</span>
            </button>

            <button
              type="button"
              onClick={() => { setTab("file"); setError(""); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                tab === "file"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg className={`w-3.5 h-3.5 ${tab === "file" ? "text-cyan-600" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span>Upload File</span>
            </button>
          </div>
          <span className="text-xs text-slate-400 ml-2 hidden md:inline">Accepts .txt, .pdf, .docx, audio transcripts, site memos</span>
        </div>

        {/* Text tab */}
        {tab === "text" && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-slate-700 mb-1.5" htmlFor="conversation-input">
              Paste conversation, transcript, or email text
            </label>
            <div className="relative">
              <textarea
                id="conversation-input"
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your conversation text here... (e.g. 'Site memo: Concrete pour delay confirmed. Amit needs to revise schedule for Nov 1 handover prioritizing MEP work on floors 5-7 by tomorrow.')"
                className="w-full text-xs font-normal text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-3.5 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition resize-y font-sans leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* File tab */}
        {tab === "file" && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Upload a document or transcript file
            </label>
            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                  dragging ? "border-cyan-500 bg-cyan-50/50" : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <p className="text-xs font-semibold text-slate-700">
                  {dragging ? "Drop file here" : "Drag & drop file here, or click to browse"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">PDF, DOCX, TXT, CSV, Markdown (Max 20MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  onChange={handleFileInput}
                  style={{ display: "none" }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <svg className="w-5 h-5 text-cyan-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                  <div className="truncate">
                    <p className="font-semibold text-slate-800 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200 transition"
                  title="Remove file"
                  aria-label="Remove file"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-xs text-rose-600 mt-2">{error}</p>}

        {/* Footer & Submit Button */}
        <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <span>Entity detection automatically links assignees, contractors & deadlines.</span>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`inline-flex items-center gap-2 px-4 py-2 text-white font-medium text-xs rounded-lg shadow-sm transition-all transform active:scale-98 ${
              canSubmit
                ? "bg-gradient-to-r from-teal-700 to-cyan-800 hover:from-teal-800 hover:to-cyan-900 cursor-pointer shadow-cyan-900/20"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            }`}
          >
            <svg className="w-3.5 h-3.5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <span>{loading ? "Extracting Tasks & Decisions..." : "Extract Tasks & Decisions"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

