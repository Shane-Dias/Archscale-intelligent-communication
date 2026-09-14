import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// ── Projects ──────────────────────────────────────────────

export const getProjects = () =>
  client.get("/projects").then((r) => r.data);

export const createProject = (name) =>
  client.post("/projects", { name }).then((r) => r.data);

export const deleteProject = (id) =>
  client.delete(`/projects/${id}`).then((r) => r.data);

// ── Extraction ────────────────────────────────────────────

export const extractFromText = (rawText, source, projectId, participants = []) =>
  client
    .post("/extract", { rawText, source, participants, projectId })
    .then((r) => r.data);

// ── Tasks ─────────────────────────────────────────────────

export const getTasks = (params = {}) =>
  client.get("/tasks", { params }).then((r) => r.data);

export const updateTaskStatus = (id, status) =>
  client.patch(`/tasks/${id}`, { status }).then((r) => r.data);

// ── Decisions ─────────────────────────────────────────────

export const getDecisions = (params = {}) =>
  client.get("/decisions", { params }).then((r) => r.data);

// ── Search ────────────────────────────────────────────────

export const search = (q, projectId) =>
  client
    .get("/search", { params: { q, ...(projectId && { projectId }) } })
    .then((r) => r.data);

export default client;
