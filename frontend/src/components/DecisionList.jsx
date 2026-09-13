const TYPE_LABELS = {
  decision: "Decision",
  approval: "Approval",
  pending_approval: "Pending Approval",
};

export default function DecisionList({ decisions }) {
  if (!decisions || decisions.length === 0) {
    return (
      <div className="card">
        <h2>Decisions & Approvals</h2>
        <p className="muted">No decisions extracted yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Decisions & Approvals</h2>
      <ul className="decision-list">
        {decisions.map((d) => (
          <li key={d._id}>
            <span className={`badge badge-${d.type}`}>
              {TYPE_LABELS[d.type] || d.type}
            </span>
            <span>{d.description}</span>
            {d.decidedBy && <span className="muted"> — {d.decidedBy}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
