const express = require("express");
const Conversation = require("../models/Conversation");
const Task = require("../models/Task");
const Decision = require("../models/Decision");

const router = express.Router();

// GET /api/search?q=keyword&projectId=
// Searches across conversations, tasks, and decisions using MongoDB text indexes.
router.get("/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) {
    return res.status(400).json({ error: "Query param 'q' is required" });
  }

  try {
    const textFilter = { $text: { $search: q } };

    // Scope to project when provided
    if (req.query.projectId) {
      textFilter.projectId = req.query.projectId;
    }

    const [conversations, tasks, decisions] = await Promise.all([
      Conversation.find(textFilter).limit(20),
      Task.find(textFilter)
        .populate("conversationId", "source rawText summary participants createdAt")
        .limit(20),
      Decision.find(textFilter)
        .populate("conversationId", "source rawText summary participants createdAt")
        .limit(20),
    ]);

    res.json({ conversations, tasks, decisions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
