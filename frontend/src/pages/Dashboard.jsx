import { useEffect, useState, useCallback } from "react";
import ConversationInput from "../components/ConversationInput";
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
    setSearchResults(null);
    setSearchQuery("");
  }, [refreshAll]);

  // Keyboard shortcut (⌘K / Ctrl+K) for focusing search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = document.getElementById("dashboard-search-input");
        if (input) input.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      <div className="flex flex-col items-center justify-center min-h-[480px] bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 text-2xl mb-4 shadow-sm">
          🏗️
        </div>
        <h2 className="text-lg font-bold text-slate-900">No project selected</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Select a project from the left sidebar or create a new project to start ingesting communications.
        </p>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6" data-purpose="primary-workspace">
      {/* ── Global Search Bar ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-sm">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            <input
              id="dashboard-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={searching}
              placeholder="Search tasks, decisions, and conversations..."
              className="block w-full pl-10 pr-20 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition shadow-inner"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-xs">
                ⌘K
              </kbd>
            </div>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition ${
              searching || !searchQuery.trim()
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-cyan-700 hover:bg-cyan-800 cursor-pointer"
            }`}
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </form>
        {searchError && <p className="text-xs text-rose-600 mt-2 px-1">{searchError}</p>}
      </div>

      {/* ── Search Results Panel ── */}
      {searchResults && (
        <SearchResultsPanel
          results={searchResults}
          query={searchQuery}
          onClear={clearSearch}
        />
      )}

      {/* ── Conversation Ingestion Section ── */}
      <ConversationInput
        projectId={projectId}
        onExtracted={handleExtracted}
      />

      {/* ── Tasks Management Section ── */}
      <TaskList
        tasks={tasks}
        onStatusChange={handleTaskUpdate}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
      />

      {/* ── Decisions and Approvals Section ── */}
      <DecisionList
        decisions={decisions}
        onNotesChange={handleDecisionNotesChange}
        onDecisionDelete={handleDecisionDelete}
      />
    </div>
  );
}

