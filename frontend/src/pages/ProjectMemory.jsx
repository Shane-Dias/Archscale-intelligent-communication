import { useState } from "react";
import SearchBar from "../components/SearchBar";
import SourcePreviewModal from "../components/SourcePreviewModal";

export default function ProjectMemory({ projectId }) {
  const [results, setResults] = useState(null);
  const [query, setQuery] = useState("");
  const [previewConv, setPreviewConv] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");

  function handleResults(data, q) {
    setResults(data);
    setQuery(q);
  }

  function openPreview(conversation, title) {
    setPreviewConv(conversation);
    setPreviewTitle(title);
  }

  if (!projectId) {
    return (
      <div className="page">
        <p className="muted">← Select a project from the sidebar to search.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Project Memory</h1>
      <p className="muted">
        Search across every past conversation, task, and decision in this
        project.
      </p>
      <SearchBar projectId={projectId} onResults={handleResults} />

      {results && (
        <div className="search-results">
          <h3>Results for "{query}"</h3>

          <div className="card">
            <h4>Conversations ({results.conversations.length})</h4>
            {results.conversations.map((c) => (
              <p key={c._id}>
                <b>{c.source}</b> — {c.summary || c.rawText.slice(0, 120)}
              </p>
            ))}
          </div>

          <div className="card">
            <h4>Tasks ({results.tasks.length})</h4>
            {results.tasks.map((t) => (
              <p key={t._id} className="search-result-row">
                <span>
                  {t.title} — <span className="muted">{t.assignee}</span>
                </span>
                {t.conversationId && (
                  <button
                    className="btn-icon"
                    onClick={() => openPreview(t.conversationId, t.title)}
                    title="View source"
                  >
                    👁
                  </button>
                )}
              </p>
            ))}
          </div>

          <div className="card">
            <h4>Decisions ({results.decisions.length})</h4>
            {results.decisions.map((d) => (
              <p key={d._id} className="search-result-row">
                <span>{d.description}</span>
                {d.conversationId && (
                  <button
                    className="btn-icon"
                    onClick={() =>
                      openPreview(d.conversationId, d.description)
                    }
                    title="View source"
                  >
                    👁
                  </button>
                )}
              </p>
            ))}
          </div>
        </div>
      )}

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
