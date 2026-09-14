const express = require("express");
const Decision = require("../models/Decision");

const router = express.Router();

// GET /api/decisions?type=&projectId=
router.get("/decisions", async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.projectId) filter.projectId = req.query.projectId;

    const decisions = await Decision.find(filter)
      .populate("conversationId", "source rawText summary participants createdAt")
      .sort({ createdAt: -1 });

    res.json(decisions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch decisions" });
  }
});

// PATCH /api/decisions/:id  Body: { notes }
router.patch("/decisions/:id", async (req, res) => {
  try {
    const { notes } = req.body;
    if (typeof notes !== "string") {
      return res.status(400).json({ error: "notes must be a string" });
    }

    const decision = await Decision.findByIdAndUpdate(
      req.params.id,
      { notes },
      { new: true }
    );

    if (!decision) return res.status(404).json({ error: "Decision not found" });
    res.json(decision);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update decision" });
  }
});

module.exports = router;
