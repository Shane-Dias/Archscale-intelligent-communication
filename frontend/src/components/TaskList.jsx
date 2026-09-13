import { updateTaskStatus } from "../api/client";

const STATUS_OPTIONS = ["pending", "in_progress", "done"];

export default function TaskList({ tasks, onStatusChange }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="card">
        <h2>Tasks</h2>
        <p className="muted">No tasks extracted yet.</p>
      </div>
    );
  }

  async function handleChange(id, status) {
    const updated = await updateTaskStatus(id, status);
    onStatusChange(updated);
  }

  return (
    <div className="card">
      <h2>Tasks</h2>
      <table>
        <thead>
          <tr>
            <th>Task</th>
            <th>Assignee</th>
            <th>Deadline</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t._id}>
              <td>{t.title}</td>
              <td>{t.assignee}</td>
              <td>
                {t.deadline ? new Date(t.deadline).toLocaleDateString() : "—"}
              </td>
              <td>
                <select
                  value={t.status}
                  onChange={(e) => handleChange(t._id, e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
