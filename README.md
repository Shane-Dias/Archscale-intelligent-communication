# ArchScale

## PROBLEM STATEMENT AS-02 · ARCHSCALE GUILD HACKATHON

ArchScale is an AI-powered project communication intelligence layer for architecture and construction teams. It turns scattered communication into searchable project memory, actionable tasks, and traceable decisions.

> **Demo:** [Add deployed-app URL](PLACEHOLDER_DEMO_URL) · **Video walkthrough:** [Add video URL](PLACEHOLDER_VIDEO_URL)

## Table of Contents

- [1. The Problem](#1-the-problem)
- [2. The Solution / What It Does](#2-the-solution--what-it-does)
  - [Features](#features)
- [3. Key Decisions](#3-key-decisions)
- [Tech Stack](#tech-stack)
- [4. Architecture](#4-architecture)
  - [Key API endpoints](#key-api-endpoints)
- [5. What AI Helped With](#5-what-ai-helped-with)
- [6. What We'd Build Next](#6-what-wed-build-next)
- [7. Setup Instructions](#7-setup-instructions)
  - [Prerequisites](#prerequisites)
- [8. Demo / Submission Links](#8-demo--submission-links)
- [Project Structure](#project-structure)

## 1. The Problem

Project information is often buried in site notes, email threads, WhatsApp updates, meeting transcripts, and shared documents. Important commitments can be missed because teams must manually identify:

- what needs to be done;
- who owns it and when it is due;
- which decisions were made, approved, or are still awaiting approval; and
- where a task or decision originally came from.

This creates fragmented project memory, weak accountability, and slow handoffs.

## 2. The Solution / What It Does

ArchScale ingests project communication, uses Gemini to extract structured information, and stores the result in a project-scoped workspace.

### Features

- **Multiple intake paths:** paste communication text or upload PDF, DOCX, TXT, CSV, or Markdown files (up to 20 MB).
- **AI extraction:** creates a concise conversation summary plus tasks and decisions from unstructured content.
- **Actionable tasks:** captures title, assignee, assignee role, deadline, status, and notes.
- **Decision tracking:** classifies items as decisions, approvals, or pending approvals, with the decision-maker.
- **Confidence scores:** Gemini assigns each extracted task and decision a 0.0–1.0 confidence score, helping teams prioritize items that need human review.
- **Project workspaces:** create and switch between projects; records and search results remain scoped to the selected project.
- **Searchable project memory:** search conversations, tasks, and decisions from one interface.
- **Source traceability:** task and decision records retain their originating conversation or uploaded-file text for review.
- **Human control:** edit task details/status and decision details/notes after extraction.

## 3. Key Decisions

| Decision | Why it was made |
| --- | --- |
| Use structured Gemini JSON output | A strict schema makes AI results persistable and predictable for the UI. |
| Include confidence scores | Teams can quickly identify outputs that may require human review. |
| Keep source text with extracted records | Users can verify extracted tasks and decisions against the original communication. |
| Scope data by project | Projects stay separated while still supporting focused search and reporting. |
| Use in-memory file uploads | Uploaded files are processed without creating an application-managed file store. |
| Resolve relative dates with a reference date | Expressions such as “tomorrow” and “by Friday” become usable deadlines. |

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Axios
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **AI:** Google Gemini API (`@google/generative-ai`)
- **File parsing:** Multer, `pdf-parse`, Mammoth

## 4. Architecture

```text
                    ┌──────────────────────────┐
                    │ React + Vite dashboard    │
                    │ projects · tasks · search │
                    └────────────┬─────────────┘
                                 │ /api
                    ┌────────────▼─────────────┐
                    │ Express API               │
                    │ ingestion · CRUD · search │
                    └───────┬──────────┬───────┘
                            │          │
             ┌──────────────▼───┐  ┌──▼──────────────────┐
             │ Google Gemini     │  │ MongoDB              │
             │ summary + JSON    │  │ projects             │
             │ task/decision AI  │  │ conversations        │
             └───────────────────┘  │ tasks · decisions    │
                                    └─────────────────────┘
```

1. A user selects a project and pastes communication or uploads a supported document.
2. Express extracts document text when needed and sends a strict JSON prompt to Gemini.
3. The API validates the response, normalizes deadlines/confidence values, then saves the conversation, tasks, and decisions to MongoDB.
4. The dashboard displays and lets users manage the structured records; search queries MongoDB text indexes across the selected project.

### Key API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET`, `POST` | `/api/projects` | List or create projects |
| `POST` | `/api/extract` | Extract from pasted text |
| `POST` | `/api/extract/file` | Extract from an uploaded file |
| `GET`, `PATCH`, `DELETE` | `/api/tasks` and `/api/tasks/:id` | Manage tasks |
| `GET`, `PATCH`, `DELETE` | `/api/decisions` and `/api/decisions/:id` | Manage decisions |
| `GET` | `/api/search?q=...&projectId=...` | Search project memory |

## 5. What AI Helped With

Gemini is used at the core of the product to transform raw communication into a summary, tasks, and decisions. The prompt instructs the model to:

- return JSON only in a fixed schema;
- identify assignees, roles, and deadlines only when supported by the source;
- resolve relative dates from the request date; and
- attach a self-assessed confidence score to every task and decision.

The application still keeps the original source and supports manual edits, so AI output can be reviewed rather than treated as unquestionable.

## 6. What We'd Build Next

- Authentication, roles, and project-member permissions.
- Native integrations for email, WhatsApp, Teams, and meeting-recording platforms.
- OCR and transcription support for scanned PDFs and audio/video recordings.
- Review queues and notifications for low-confidence, overdue, or unassigned items.
- Project analytics: recurring blockers, decision timelines, and responsibility reports.
- Background processing and job status for larger uploads.

## 7. Setup Instructions

### Prerequisites

- Node.js 18 or later
- A MongoDB connection string (local MongoDB or MongoDB Atlas)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 1. Configure the backend

Create `backend/.env` with your own values:

```env
MONGO_URI=mongodb://localhost:27017/archscale
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

Install dependencies and start the API:

```powershell
cd backend
npm install
npm run dev
```

The backend runs at `http://localhost:5000`. Verify it with:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

### 2. Start the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` calls to the backend on port `5000` during local development.

### 3. Try the app

1. Create a project from the sidebar and select it.
2. Paste a conversation or upload a supported file.
3. Choose its source and select **Extract Tasks & Decisions**.
4. Review the generated summary, tasks, deadlines, decisions, and confidence scores.
5. Search within the project and open the source preview to verify an extracted item.

### Optional checks

The repository includes a lightweight confidence-validation script:

```powershell
node backend/routes/extract.test.js
```

## 8. Demo / Submission Links

| Item | Link |
| --- | --- |
| Live demo | [PLACEHOLDER — add deployment URL](PLACEHOLDER_DEMO_URL) |
| Video walkthrough | [PLACEHOLDER — add a 2–3 minute walkthrough](PLACEHOLDER_VIDEO_URL) |

## Project Structure

```text
ArchScale/
├── backend/
│   ├── config/          # MongoDB connection
│   ├── models/          # Project, Conversation, Task, Decision schemas
│   ├── routes/          # API routes and ingestion pipelines
│   ├── utils/           # Gemini prompt and response parsing
│   └── seed/            # Sample conversation data
└── frontend/
    └── src/
        ├── api/         # API client
        ├── components/  # Dashboard UI components
        └── pages/       # Main dashboard
```
