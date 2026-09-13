import { useState } from "react";
import SearchBar from "../components/SearchBar";

export default function ProjectMemory() {
  const [results, setResults] = useState(null);
  const [query, setQuery] = useState("");

  function handleResults(data, q) {
    setResults(data);
    setQuery(q);
  }

  return (
    <div className="page">
      <h1>Project Memory</h1>
      <p className="muted">
        Search across every past conversation, task, and decision.
      </p>
      <SearchBar onResults={handleResults} />

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
              <p key={t._id}>
                {t.title} — <span className="muted">{t.assignee}</span>
              </p>
            ))}
          </div>

          <div className="card">
            <h4>Decisions ({results.decisions.length})</h4>
            {results.decisions.map((d) => (
              <p key={d._id}>{d.description}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
