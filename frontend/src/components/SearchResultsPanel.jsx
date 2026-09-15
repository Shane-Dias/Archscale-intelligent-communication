import SourcePreviewModal from "./SourcePreviewModal";
import { useState } from "react";

/**
 * SearchResultsPanel
 * Renders search results for conversations, tasks, and decisions inline
 * below the main dashboard content.
 *
 * Props:
 *   results  – { conversations: [], tasks: [], decisions: [] }
 *   query    – the search string that produced these results
 *   onClear  – callback to dismiss the panel
 */

const TYPE_LABELS = {
  decision:         "Decision",
  approval:         "Approval",
  pending_approval: "Pending Approval",
};

const SOURCE_LABELS = {
  manual:             "Manual",
  whatsapp:           "WhatsApp",
  email:              "Email",
  meeting_transcript: "Meeting Transcript",
  voice_call:         "Voice Call",
  other:              "Other",
};

export default function SearchResultsPanel({ results, query, onClear }) {
  const [previewConv,  setPreviewConv]  = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");

  if (!results) return null;

  const total =
    results.conversations.length + results.tasks.length + results.decisions.length;

  return (
    <div className="search-panel">
      {/* Panel header */}
      <div className="search-panel-header">
        <span className="search-panel-title">
          {total === 0
            ? `No results for "${query}"`
            : `${total} result${total !== 1 ? "s" : ""} for "${query}"`}
        </span>
        <button
          className="btn-secondary search-panel-clear"
          onClick={onClear}
          aria-label="Clear search results"
        >
          ✕ Clear
        </button>
      </div>

      {total === 0 && (
        <p className="muted search-panel-empty">
          Try different keywords or check your spelling.
        </p>
      )}

      {/* ── Conversations ── */}
      {results.conversations.length > 0 && (
        <section className="search-section">
          <h4 className="search-section-title">
            Conversations
            <span className="search-section-count">{results.conversations.length}</span>
          </h4>
          <ul className="search-result-list">
            {results.conversations.map((c) => (
              <li key={c._id} className="search-result-item">
                <div className="search-result-main">
                  <span className="badge badge-source">
                    {SOURCE_LABELS[c.source] || c.source}
                  </span>
                  <span className="search-result-text">
                    {c.summary || c.rawText?.slice(0, 140)}
                  </span>
                </div>
                <span className="muted search-result-date">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Tasks ── */}
      {results.tasks.length > 0 && (
        <section className="search-section">
          <h4 className="search-section-title">
            Tasks
            <span className="search-section-count">{results.tasks.length}</span>
          </h4>
          <ul className="search-result-list">
            {results.tasks.map((t) => (
              <li key={t._id} className="search-result-item">
                <div className="search-result-main">
                  <span className="search-result-text search-result-bold">{t.title}</span>
                  <span className="muted">
                    {t.assignee}
                    {t.assigneeRole && (
                      <span className="assignee-role-badge" style={{ marginLeft: 6 }}>
                        {t.assigneeRole}
                      </span>
                    )}
                  </span>
                  {t.deadline && (
                    <span className="muted">
                      Due {new Date(t.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="search-result-actions">
                  {t.conversationId && (
                    <button
                      className="btn-icon"
                      onClick={() => {
                        setPreviewConv(t.conversationId);
                        setPreviewTitle(t.title);
                      }}
                      title="View source"
                    >
                      👁
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Decisions ── */}
      {results.decisions.length > 0 && (
        <section className="search-section">
          <h4 className="search-section-title">
            Decisions & Approvals
            <span className="search-section-count">{results.decisions.length}</span>
          </h4>
          <ul className="search-result-list">
            {results.decisions.map((d) => (
              <li key={d._id} className="search-result-item">
                <div className="search-result-main">
                  <span className={`badge badge-${d.type}`}>
                    {TYPE_LABELS[d.type] || d.type}
                  </span>
                  <span className="search-result-text">{d.description}</span>
                  {d.decidedBy && (
                    <span className="muted">— {d.decidedBy}</span>
                  )}
                </div>
                <div className="search-result-actions">
                  {d.conversationId && (
                    <button
                      className="btn-icon"
                      onClick={() => {
                        setPreviewConv(d.conversationId);
                        setPreviewTitle(d.description);
                      }}
                      title="View source"
                    >
                      👁
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
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
