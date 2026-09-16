import { useState } from "react";
import SourcePreviewModal from "./SourcePreviewModal";

const TYPE_LABELS = {
  decision: "Decision",
  approval: "Approval",
  pending_approval: "Pending Approval",
};

const SOURCE_LABELS = {
  manual: "Manual",
  whatsapp: "WhatsApp",
  email: "Email",
  meeting_transcript: "Meeting Transcript",
  voice_call: "Voice Call",
  other: "Other",
};

const EyeIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

const XIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

function formatDate(date) {
  if (!date) return null;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString();
}

function ResultBadge({ type, label }) {
  const styles = {
    conversation: "bg-violet-50 text-violet-700 border-violet-200",
    decision: "bg-blue-50 text-blue-700 border-blue-200",
    approval: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending_approval: "bg-amber-50 text-amber-800 border-amber-200",
  };

  return (
    <span className={`inline-flex shrink-0 items-center rounded-md border px-2 py-1 text-[11px] font-semibold ${styles[type] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
      {label}
    </span>
  );
}

function ResultSection({ title, count, children }) {
  return (
    <section>
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
        <span className="inline-flex min-w-5 justify-center rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
          {count}
        </span>
      </div>
      <ul className="divide-y divide-slate-100">{children}</ul>
    </section>
  );
}

function SourceButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
      title="View source"
      aria-label={label}
    >
      <EyeIcon />
    </button>
  );
}

export default function SearchResultsPanel({ results, query, onClear }) {
  const [previewConv, setPreviewConv] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");

  if (!results) return null;

  const conversations = results.conversations || [];
  const tasks = results.tasks || [];
  const decisions = results.decisions || [];
  const total = conversations.length + tasks.length + decisions.length;

  function openPreview(conversation, title) {
    setPreviewConv(conversation);
    setPreviewTitle(title);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-live="polite">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-base font-bold text-slate-900">
            {total === 0 ? "No results found" : `${total} result${total === 1 ? "" : "s"} found`}
          </p>
          <p className="mt-0.5 truncate text-sm text-slate-500" title={query}>
            Search results for <span className="font-medium text-slate-700">“{query}”</span>
          </p>
        </div>
        <button type="button" onClick={onClear} className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:self-auto">
          <XIcon /> Clear results
        </button>
      </div>

      {total === 0 ? (
        <div className="px-5 py-12 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 21l-4.35-4.35m1.35-5.15a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">Try a different search term</p>
          <p className="mt-1 text-xs text-slate-500">Check the spelling or use a broader keyword.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {conversations.length > 0 && (
            <ResultSection title="Conversations" count={conversations.length}>
              {conversations.map((conversation) => {
                const title = conversation.summary || conversation.rawText || "Untitled conversation";
                return (
                  <li key={conversation._id} className="flex items-start gap-3 px-5 py-4 transition hover:bg-slate-50/70">
                    <ResultBadge type="conversation" label={SOURCE_LABELS[conversation.source] || conversation.source || "Conversation"} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-800">{title}</p>
                      {formatDate(conversation.createdAt) && <p className="mt-1 text-xs text-slate-500">{formatDate(conversation.createdAt)}</p>}
                    </div>
                    <SourceButton onClick={() => openPreview(conversation, title)} label="View conversation source" />
                  </li>
                );
              })}
            </ResultSection>
          )}

          {tasks.length > 0 && (
            <ResultSection title="Tasks" count={tasks.length}>
              {tasks.map((task) => (
                <li key={task._id} className="flex items-start gap-3 px-5 py-4 transition hover:bg-slate-50/70">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug text-slate-900">{task.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      {task.assignee && <span>{task.assignee}</span>}
                      {task.assigneeRole && <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{task.assigneeRole}</span>}
                      {formatDate(task.deadline) && <span>Due {formatDate(task.deadline)}</span>}
                    </div>
                  </div>
                  {task.conversationId && <SourceButton onClick={() => openPreview(task.conversationId, task.title)} label={`View source for ${task.title}`} />}
                </li>
              ))}
            </ResultSection>
          )}

          {decisions.length > 0 && (
            <ResultSection title="Decisions & Approvals" count={decisions.length}>
              {decisions.map((decision) => (
                <li key={decision._id} className="flex items-start gap-3 px-5 py-4 transition hover:bg-slate-50/70">
                  <ResultBadge type={decision.type} label={TYPE_LABELS[decision.type] || decision.type} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-slate-800">{decision.description}</p>
                    {decision.decidedBy && <p className="mt-1 text-xs text-slate-500">Decided by <span className="font-medium text-slate-600">{decision.decidedBy}</span></p>}
                  </div>
                  {decision.conversationId && <SourceButton onClick={() => openPreview(decision.conversationId, decision.description)} label="View decision source" />}
                </li>
              ))}
            </ResultSection>
          )}
        </div>
      )}

      {previewConv && <SourcePreviewModal conversation={previewConv} itemTitle={previewTitle} onClose={() => setPreviewConv(null)} />}
    </section>
  );
}
