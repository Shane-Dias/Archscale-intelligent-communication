import { useEffect, useState, useCallback } from "react";
import ConversationInput from "../components/ConversationInput";
import SummaryCard from "../components/SummaryCard";
import TaskList from "../components/TaskList";
import DecisionList from "../components/DecisionList";
import { getTasks, getDecisions } from "../api/client";

export default function Dashboard({ projectId }) {
  const [latestConversation, setLatestConversation] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [decisions, setDecisions] = useState([]);

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
  }, [refreshAll]);

  function handleExtracted(result) {
    setLatestConversation(result.conversation);
    setTasks((prev) => [...result.tasks, ...prev]);
    setDecisions((prev) => [...result.decisions, ...prev]);
  }

  function handleStatusChange(updatedTask) {
    setTasks((prev) =>
      prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
    );
  }

  function handleTaskNotesChange(updatedTask) {
    setTasks((prev) =>
      prev.map((t) => (t._id === updatedTask._id ? { ...t, notes: updatedTask.notes } : t))
    );
  }

  function handleDecisionNotesChange(updatedDecision) {
    setDecisions((prev) =>
      prev.map((d) => (d._id === updatedDecision._id ? { ...d, notes: updatedDecision.notes } : d))
    );
  }

  if (!projectId) {
    return (
      <div className="page">
        <p className="muted">← Select a project from the sidebar to get started.</p>
      </div>
    );
  }

  return (
    <div className="layout">
      <div className="left-col">
        <ConversationInput
          projectId={projectId}
          onExtracted={handleExtracted}
        />
        <SummaryCard conversation={latestConversation} />
      </div>
      <div className="right-col">
        <TaskList tasks={tasks} onStatusChange={handleStatusChange} onNotesChange={handleTaskNotesChange} />
        <DecisionList decisions={decisions} onNotesChange={handleDecisionNotesChange} />
      </div>
    </div>
  );
}
