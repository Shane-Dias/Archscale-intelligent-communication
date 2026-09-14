const express = require("express");
const Task = require("../models/Task");

const router = express.Router();

// GET /api/tasks?assignee=&status=&projectId=
router.get("/tasks", async (req, res) => {
  try {
    const filter = {};
    if (req.query.assignee) filter.assignee = req.query.assignee;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.projectId) filter.projectId = req.query.projectId;

    const tasks = await Task.find(filter)
      .populate("conversationId", "source rawText summary participants createdAt")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// PATCH /api/tasks/:id  Body: { status }
router.patch("/tasks/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "in_progress", "done"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

module.exports = router;
