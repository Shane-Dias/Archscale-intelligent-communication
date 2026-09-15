import { useEffect, useState, useCallback } from "react";
import ConversationInput from "../components/ConversationInput";
import TaskList from "../components/TaskList";
import DecisionList from "../components/DecisionList";
import SearchResultsPanel from "../components/SearchResultsPanel";
import { getTasks, getDecisions, search } from "../api/client";

/**
 * Props:
 *  projectId                – selected project _id
 *  externalSearch           – search query fired from the navbar (string)
 *  onExternalSearchConsumed – called after we've acted on externalSearch so App can reset it
 */
export default function Dashboard({ projectId, externalSearch = "", onExternalSearchConsumed }) {
  const [tasks,     setTasks]     = useState([]);
  const [decisions, setDecisions] = useState([]);

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
    setSearchResults(null);
    setSearchQuery("");
  }, [refreshAll]);

  // Fire search when the navbar pushes a query
  useEffect(() => {
    if (!externalSearch || !projectId) return;
    setSearchQuery(externalSearch);
    runSearch(externalSearch);
    onExternalSearchConsumed?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalSearch]);

  async function runSearch(q) {
    if (!q.trim() || !projectId) return;
    setSearching(true);
    setSearchError("");
    setSearchResults(null);
    try {
      const results = await search(q.trim(), projectId);
      setSearchResults(results);
    } catch {
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    await runSearch(searchQuery);
  }

  function clearSearch() {
    setSearchResults(null);
    setSearchQuery("");
    setSearchError("");
  }

  function handleExtracted(result) {
    setTasks((prev)     => [...result.tasks,     ...prev]);
    setDecisions((prev) => [...result.decisions, ...prev]);
  }

  function handleTaskUpdate(updatedTask) {
    setTasks((prev) => prev.map((t) => t._id === updatedTask._id ? { ...t, ...updatedTask } : t));
  }

  function handleTaskDelete(taskId) {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  }

  function handleDecisionNotesChange(updatedDecision) {
    setDecisions((prev) =>
      prev.map((d) => d._id === updatedDecision._id ? { ...d, notes: updatedDecision.notes } : d)
    );
  }

  function handleDecisionDelete(decisionId) {
    setDecisions((prev) => prev.filter((d) => d._id !== decisionId));
  }

  // ── empty state ───────────────────────────────────────────────────────────
  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[480px] bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-slate-800">No project selected</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Select a project from the sidebar or create a new one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Inline search bar (scoped to dashboard, below navbar) ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={searching}
              placeholder="Search within this project…"
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                aria-label="Clear"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 text-white transition flex-shrink-0"
          >
            {searching ? "Searching…" : "Search"}
          </button>
          {searchResults && (
            <button
              type="button"
              onClick={clearSearch}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition flex-shrink-0"
            >
              Clear results
            </button>
          )}
        </form>
        {searchError && <p className="text-xs text-rose-600 mt-2 px-1">{searchError}</p>}
      </div>

      {/* ── Search results ── */}
      {searchResults && (
        <SearchResultsPanel
          results={searchResults}
          query={searchQuery}
          onClear={clearSearch}
        />
      )}

      {/* ── Conversation ingestion ── */}
      <ConversationInput projectId={projectId} onExtracted={handleExtracted} />

      {/* ── Tasks ── */}
      <TaskList
        tasks={tasks}
        onStatusChange={handleTaskUpdate}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
      />

      {/* ── Decisions ── */}
      <DecisionList
        decisions={decisions}
        onNotesChange={handleDecisionNotesChange}
        onDecisionDelete={handleDecisionDelete}
      />
    </div>
  );
}
