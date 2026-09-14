import { useState, useRef } from "react";
import { extractFromText, extractFromFile } from "../api/client";

const SOURCES = [
  { value: "manual",              label: "Manual" },
  { value: "whatsapp",            label: "WhatsApp" },
  { value: "email",               label: "Email" },
  { value: "meeting_transcript",  label: "Meeting Transcript" },
  { value: "voice_call",          label: "Voice Call" },
  { value: "other",               label: "Other" },
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

function FileIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
      <line x1="9" y1="17" x2="13" y2="17"/>
    </svg>
  );
}

export default function ConversationInput({ projectId, onExtracted }) {
  const [tab, setTab]         = useState("text"); // "text" | "file"
  const [source, setSource]   = useState("manual");
  const [text, setText]       = useState("");
  const [file, setFile]       = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const fileInputRef = useRef(null);

  // ── helpers ──────────────────────────────────────────────────────────────

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
    e.target.value = ""; // allow re-selecting same file
  }

  function removeFile() { setFile(null); setError(""); }

  // ── submit ────────────────────────────────────────────────────────────────

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

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <form className="card conversation-input-card" onSubmit={handleSubmit}>
      <h2>Add a Conversation</h2>

      {/* Source selector */}
      <label className="field-label" htmlFor="source">Source</label>
      <select
        id="source"
        value={source}
        onChange={(e) => setSource(e.target.value)}
      >
        {SOURCES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Tab switcher */}
      <div className="input-tabs" role="tablist" aria-label="Input method">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "text"}
          className={`input-tab${tab === "text" ? " active" : ""}`}
          onClick={() => { setTab("text"); setError(""); }}
        >
          ✏️ Paste Text
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "file"}
          className={`input-tab${tab === "file" ? " active" : ""}`}
          onClick={() => { setTab("file"); setError(""); }}
        >
          📎 Upload File
        </button>
      </div>

      {/* ── Text tab ── */}
      {tab === "text" && (
        <>
          <label className="field-label" htmlFor="rawText">
            Paste conversation, transcript, or email text
          </label>
          <textarea
            id="rawText"
            rows={10}
            placeholder={
              source === "voice_call"
                ? "Paste a voice call transcript here..."
                : source === "whatsapp"
                ? "Paste a WhatsApp chat export here..."
                : source === "email"
                ? "Paste the email thread here..."
                : source === "meeting_transcript"
                ? "Paste the meeting transcript here..."
                : "Paste your conversation text here..."
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </>
      )}

      {/* ── File tab ── */}
      {tab === "file" && (
        <>
          <label className="field-label">
            Upload a file
            <span className="field-hint"> — PDF, DOCX, TXT, CSV, Markdown (max 20 MB)</span>
          </label>

          {!file ? (
            <div
              className={`drop-zone${dragging ? " dragging" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Click or drag a file to upload"
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              <div className="drop-zone-icon"><FileIcon /></div>
              <p className="drop-zone-primary">
                {dragging ? "Drop the file here" : "Drag & drop a file, or click to browse"}
              </p>
              <p className="drop-zone-secondary">PDF · DOCX · TXT · CSV · Markdown</p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={handleFileInput}
                style={{ display: "none" }}
                aria-hidden="true"
              />
            </div>
          ) : (
            <div className="file-selected">
              <div className="file-selected-icon"><FileIcon /></div>
              <div className="file-selected-info">
                <span className="file-selected-name">{file.name}</span>
                <span className="file-selected-size muted">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              </div>
              <button
                type="button"
                className="btn-icon file-remove-btn"
                onClick={removeFile}
                aria-label="Remove file"
                title="Remove file"
              >
                ✕
              </button>
            </div>
          )}
        </>
      )}

      {error && <p className="error-text">{error}</p>}

      <button type="submit" disabled={!canSubmit}>
        {loading ? "Extracting…" : "Extract Tasks & Decisions"}
      </button>
    </form>
  );
}
