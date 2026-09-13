export default function SummaryCard({ conversation }) {
  if (!conversation) return null;

  return (
    <div className="card">
      <h2>Latest Summary</h2>
      <p className="muted">
        Source: {conversation.source} ·{" "}
        {new Date(conversation.createdAt).toLocaleString()}
      </p>
      <p>{conversation.summary || "No summary generated."}</p>
    </div>
  );
}
