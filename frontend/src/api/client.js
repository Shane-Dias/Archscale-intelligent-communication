import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export const extractFromText = (rawText, source, participants = []) =>
  client.post("/extract", { rawText, source, participants }).then((r) => r.data);

export const getTasks = (params = {}) =>
  client.get("/tasks", { params }).then((r) => r.data);

export const updateTaskStatus = (id, status) =>
  client.patch(`/tasks/${id}`, { status }).then((r) => r.data);

export const getDecisions = (params = {}) =>
  client.get("/decisions", { params }).then((r) => r.data);

export const search = (q) =>
  client.get("/search", { params: { q } }).then((r) => r.data);

export default client;
