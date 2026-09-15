import { useState } from "react";
import ProjectSidebar from "./components/ProjectSidebar";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>ArchScale — Project Communication Intelligence</h1>
      </header>

      <div className="app-layout">
        <ProjectSidebar
          selectedId={selectedProjectId}
          onSelect={setSelectedProjectId}
        />
        <main>
          <Dashboard projectId={selectedProjectId} />
        </main>
      </div>
    </div>
  );
}
