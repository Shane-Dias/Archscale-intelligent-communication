import { useState } from "react";
import { extractFromText } from "../api/client";

const SOURCES = ["manual", "whatsapp", "email", "meeting_transcript", "other"];

export default function ConversationInput({ projectId, onExtracted }) {
  const [text, setText] = useState("");
  const [source, setSource] = useState("manual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || !projectId) return;

    setLoading(true);
    setError("");
    try {
      const result = await extractFromText(text, source, projectId);
      onExtracted(result);
      setText("");
    } catch (err) {
      setError(
        err?.response?.data?.error || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Add a Conversation</h2>
      <label className="field-label" htmlFor="source">
        Source
      </label>
      <select
        id="source"
        value={source}
        onChange={(e) => setSource(e.target.value)}
      >
        {SOURCES.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </select>

      <label className="field-label" htmlFor="rawText">
        Paste conversation / transcript / email text
      </label>
      <textarea
        id="rawText"
        rows={10}
        placeholder="Paste a WhatsApp chat export, meeting transcript, or email thread here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {error && <p className="error-text">{error}</p>}

      <button type="submit" disabled={loading || !projectId}>
        {loading ? "Extracting..." : "Extract Tasks & Decisions"}
      </button>
    </form>
  );
}
