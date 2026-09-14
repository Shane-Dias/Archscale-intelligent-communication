const express = require("express");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Decision = require("../models/Decision");
const Conversation = require("../models/Conversation");

const router = express.Router();

/**
 * GET /api/projects
 * Returns all projects with aggregated task / decision counts.
 */
router.get("/projects", async (_req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: 1 }).lean();

    // Aggregate counts in parallel
    const enriched = await Promise.all(
      projects.map(async (p) => {
        const [taskCount, decisionCount] = await Promise.all([
          Task.countDocuments({ projectId: p._id }),
          Decision.countDocuments({ projectId: p._id }),
        ]);
        return { ...p, taskCount, decisionCount };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

/**
 * POST /api/projects
 * Body: { name: string }
 */
router.post("/projects", async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Project name is required" });
  }

  try {
    const project = await Project.create({ name: name.trim() });
    res.status(201).json({ ...project.toObject(), taskCount: 0, decisionCount: 0 });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "A project with that name already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

/**
 * DELETE /api/projects/:id
 * Only deletes if the project has no conversations.
 */
router.delete("/projects/:id", async (req, res) => {
  try {
    const convCount = await Conversation.countDocuments({ projectId: req.params.id });
    if (convCount > 0) {
      return res.status(400).json({
        error: `Cannot delete — project still has ${convCount} conversation(s). Reassign them first.`,
      });
    }

    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Project not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

module.exports = router;
