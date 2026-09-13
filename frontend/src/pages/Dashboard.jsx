import { useEffect, useState, useCallback } from "react";
import ConversationInput from "../components/ConversationInput";
import SummaryCard from "../components/SummaryCard";
import TaskList from "../components/TaskList";
import DecisionList from "../components/DecisionList";
import { getTasks, getDecisions } from "../api/client";

export default function Dashboard() {
  const [latestConversation, setLatestConversation] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [decisions, setDecisions] = useState([]);

  const refreshAll = useCallback(async () => {
    const [t, d] = await Promise.all([getTasks(), getDecisions()]);
    setTasks(t);
    setDecisions(d);
  }, []);

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

  return (
    <div className="layout">
      <div className="left-col">
        <ConversationInput onExtracted={handleExtracted} />
        <SummaryCard conversation={latestConversation} />
      </div>
      <div className="right-col">
        <TaskList tasks={tasks} onStatusChange={handleStatusChange} />
        <DecisionList decisions={decisions} />
      </div>
    </div>
  );
}
