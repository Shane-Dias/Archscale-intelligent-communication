import { useEffect, useState, useCallback } from "react";
import ConversationInput from "../components/ConversationInput";
import SummaryCard from "../components/SummaryCard";
import TaskList from "../components/TaskList";
import DecisionList from "../components/DecisionList";
import SearchResultsPanel from "../components/SearchResultsPanel";
import { getTasks, getDecisions, search } from "../api/client";

export default function Dashboard({ projectId }) {
  const [latestConversation, setLatestConversation] = useState(null);
  const [tasks,     setTasks]     = useState([]);
  const [decisions, setDecisions] = useState([]);

  // Search state
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching,     setSearching]     = useState(false);
  const [searchError,   setSearchError]   = useState("");

  const refreshAll = useCallback(async () => {
    if (!projectId) return;
    const [t, d] = await Promise.all([
      getTasks({ projectId }),
      getDecisions({ projectId }),
    ]);
    setTasks(t);
    setDecisions(d);
  }, [projectId]);

  useEffect(() => {
    refreshAll();
    // Clear search when project changes
    setSearchResults(null);
    setSearchQuery("");
  }, [refreshAll]);

  // ── handlers ──────────────────────────────────────────────────────────────

  function handleExtracted(result) {
    setLatestConversation(result.conversation);
    setTasks((prev)     => [...result.tasks,     ...prev]);
    setDecisions((prev) => [...result.decisions, ...prev]);
  }

  function handleTaskUpdate(updatedTask) {
    setTasks((prev) =>
      prev.map((t) => t._id === updatedTask._id ? { ...t, ...updatedTask } : t)
    );
  }

  function handleTaskDelete(taskId) {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  }

  function handleDecisionNotesChange(updatedDecision) {
    setDecisions((prev) =>
      prev.map((d) =>
        d._id === updatedDecision._id ? { ...d, notes: updatedDecision.notes } : d
      )
    );
  }

  function handleDecisionDelete(decisionId) {
    setDecisions((prev) => prev.filter((d) => d._id !== decisionId));
  }

  async function handleSearch(e) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q || !projectId) return;
    setSearching(true);
    setSearchError("");
    setSearchResults(null);
    try {
      const results = await search(q, projectId);
      setSearchResults(results);
    } catch {
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setSearchResults(null);
    setSearchQuery("");
    setSearchError("");
  }

  // ── empty state ───────────────────────────────────────────────────────────

  if (!projectId) {
    return (
      <div className="page dashboard-empty">
        <div className="dashboard-empty-inner">
          <div className="dashboard-empty-icon">🏗️</div>
          <h2>No project selected</h2>
          <p className="muted">Select a project from the sidebar to get started.</p>
        </div>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="dashboard">

      {/* ── Search bar — top of content ── */}
      <div className="dashboard-search-row">
        <form className="dashboard-search-form" onSubmit={handleSearch}>
          <div className="dashboard-search-input-wrap">
            <span className="dashboard-search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              className="dashboard-search-input"
              placeholder="Search tasks, decisions, and conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={searching}
            />
            {searchQuery && (
              <button
                type="button"
                className="dashboard-search-clear"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="dashboard-search-btn"
            disabled={searching || !searchQuery.trim()}
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </form>
        {searchError && <p className="error-text" style={{ margin: "6px 0 0" }}>{searchError}</p>}
      </div>

      {/* ── Search results panel ── */}
      {searchResults && (
        <SearchResultsPanel
          results={searchResults}
          query={searchQuery}
          onClear={clearSearch}
        />
      )}

      {/* ── Main two-column layout ── */}
      <div className="dashboard-grid">

        {/* Left col — input + summary */}
        <div className="dashboard-left">
          <ConversationInput
            projectId={projectId}
            onExtracted={handleExtracted}
          />
          <SummaryCard conversation={latestConversation} />
        </div>

        {/* Right col — tasks + decisions */}
        <div className="dashboard-right">
          <TaskList
            tasks={tasks}
            onStatusChange={handleTaskUpdate}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
          />
          <DecisionList
            decisions={decisions}
            onNotesChange={handleDecisionNotesChange}
            onDecisionDelete={handleDecisionDelete}
          />
        </div>

      </div>
    </div>
  );
}
