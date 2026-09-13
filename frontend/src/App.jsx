import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import ProjectMemory from "./pages/ProjectMemory";

export default function App() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="app">
      <header className="app-header">
        <h1>ArchScale — Project Communication Intelligence</h1>
        <nav>
          <button
            className={tab === "dashboard" ? "active" : ""}
            onClick={() => setTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={tab === "memory" ? "active" : ""}
            onClick={() => setTab("memory")}
          >
            Project Memory
          </button>
        </nav>
      </header>

      <main>{tab === "dashboard" ? <Dashboard /> : <ProjectMemory />}</main>
    </div>
  );
}
