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

// PATCH /api/tasks/:id  Body: { title?, assignee?, deadline?, status?, notes? }
router.patch("/tasks/:id", async (req, res) => {
  try {
    const { title, assignee, deadline, status, notes } = req.body;
    const update = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "title must be a non-empty string" });
      }
      update.title = title.trim();
    }

    if (assignee !== undefined) {
      if (typeof assignee !== "string") {
        return res.status(400).json({ error: "assignee must be a string" });
      }
      update.assignee = assignee.trim() || "Unassigned";
    }

    if (deadline !== undefined) {
      if (deadline === null || deadline === "") {
        update.deadline = null;
      } else {
        const d = new Date(deadline);
        if (isNaN(d.getTime())) {
          return res.status(400).json({ error: "deadline must be a valid date or null" });
        }
        update.deadline = d;
      }
    }

    if (status !== undefined) {
      if (!["pending", "in_progress", "done"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      update.status = status;
    }

    if (notes !== undefined) {
      if (typeof notes !== "string") {
        return res.status(400).json({ error: "notes must be a string" });
      }
      update.notes = notes;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate("conversationId", "source rawText summary participants createdAt fileName");

    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

module.exports = router;
