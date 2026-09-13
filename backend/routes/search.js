const express = require("express");
const Conversation = require("../models/Conversation");
const Task = require("../models/Task");
const Decision = require("../models/Decision");

const router = express.Router();

// GET /api/search?q=keyword
// Searches across conversations, tasks, and decisions using MongoDB text indexes.
router.get("/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) {
    return res.status(400).json({ error: "Query param 'q' is required" });
  }

  try {
    const [conversations, tasks, decisions] = await Promise.all([
      Conversation.find({ $text: { $search: q } }).limit(20),
      Task.find({ $text: { $search: q } }).limit(20),
      Decision.find({ $text: { $search: q } }).limit(20),
    ]);

    res.json({ conversations, tasks, decisions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
