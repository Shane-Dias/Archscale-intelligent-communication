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

  // Replaces the whole task object in state — used by status change AND full edit save
  function handleTaskUpdate(updatedTask) {
    setTasks((prev) =>
      prev.map((t) => (t._id === updatedTask._id ? { ...t, ...updatedTask } : t))
    );
  }

  function handleTaskDelete(taskId) {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  }

  function handleDecisionNotesChange(updatedDecision) {
    setDecisions((prev) =>
      prev.map((d) => (d._id === updatedDecision._id ? { ...d, notes: updatedDecision.notes } : d))
    );
  }

  function handleDecisionDelete(decisionId) {
    setDecisions((prev) => prev.filter((d) => d._id !== decisionId));
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
  );
}
