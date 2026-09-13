# ArchScale — Intelligent Project Communication Layer

Hackathon project (AS-02) that turns unstructured project communication
(chat, transcripts, emails) into structured, searchable project data:
summaries, tasks, responsible owners, deadlines, and decisions/approvals.

**Stack:** MongoDB · Express.js · React.js (Vite) · Node.js — AI: Google Gemini API

---

## 1. Prerequisites

- Node.js 18+
- A free Gemini API key from https://aistudio.google.com (no card required)
- A MongoDB connection string — either:
  - a free MongoDB Atlas cluster (M0 tier), or
  - a local MongoDB instance (`mongodb://localhost:27017/archscale`)

## 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# now edit .env and fill in GEMINI_API_KEY and MONGO_URI
npm run dev
```

The API starts on `http://localhost:5000`. Check it's alive:

```bash
curl http://localhost:5000/api/health
```

## 3. Frontend Setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app starts on `http://localhost:5173` (Vite dev server proxies
`/api` calls to the backend on port 5000 — see `vite.config.js`).

## 4. Try It Out

1. Open `http://localhost:5173`.
2. Paste a sample conversation from `backend/seed/sampleConversations.js`
   into the input box (or your own WhatsApp export / meeting transcript).
3. Click **Extract Tasks & Decisions**.
4. Watch the summary, task list, and decisions populate.
5. Switch to the **Project Memory** tab and search for a keyword from
   the conversation to confirm search works end-to-end.

## 5. Project Structure

```
archscale-hackathon/
  backend/
    config/db.js            MongoDB connection
    models/                 Conversation, Task, Decision schemas
    routes/
      extract.js             POST /api/extract  (Gemini call + save)
      tasks.js                GET/PATCH /api/tasks
      decisions.js            GET /api/decisions
      search.js                GET /api/search
    utils/geminiPrompt.js    Prompt template + JSON parsing helper
    seed/sampleConversations.js  Demo data
    server.js                Express app entry point
  frontend/
    src/
      api/client.js           Axios wrapper for backend calls
      components/             ConversationInput, TaskList, DecisionList,
                               SummaryCard, SearchBar
      pages/                  Dashboard, ProjectMemory
      App.jsx, main.jsx, index.css
```

## 6. Key API Endpoints

| Method | Endpoint            | Purpose                                       |
|--------|----------------------|------------------------------------------------|
| POST   | /api/extract         | Submit raw text → summary + tasks + decisions |
| GET    | /api/tasks           | List tasks (filter by `assignee`, `status`)   |
| PATCH  | /api/tasks/:id       | Update task status                            |
| GET    | /api/decisions       | List decisions/approvals (filter by `type`)   |
| GET    | /api/search?q=       | Full-text search across all collections       |

## 7. Notes for the Demo

- If Gemini rate-limits during a live demo, the extraction route returns
  a clear error message rather than crashing — you can retry.
- The extraction prompt is intentionally strict (`utils/geminiPrompt.js`)
  to reduce the chance of malformed JSON; if you switch models, keep the
  "return ONLY JSON" instruction intact.
- Full-text search relies on MongoDB text indexes already defined in the
  schemas (`$text` index on `rawText`/`summary`/`title`/`description`) —
  no extra setup needed once the app has written a few documents.

## 8. Things to Extend if You Have Time

- Add authentication so tasks/decisions are scoped per project.
- Support file upload (PDF/audio transcript) instead of paste-only.
- Add a "confidence" field from Gemini so low-confidence extractions
  can be flagged for human review.
