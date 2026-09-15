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
      .populate("conversationId", "source rawText summary participants createdAt fileName")
      .sort({ createdAt: -1 });

    res.json(decisions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch decisions" });
  }
});

// PATCH /api/decisions/:id  Body: { notes?, decidedBy?, description?, type? }
router.patch("/decisions/:id", async (req, res) => {
  try {
    const { notes, decidedBy, description, type } = req.body;
    const update = {};

    if (notes !== undefined) {
      if (typeof notes !== "string") {
        return res.status(400).json({ error: "notes must be a string" });
      }
      update.notes = notes;
    }

    if (decidedBy !== undefined) {
      if (typeof decidedBy !== "string") {
        return res.status(400).json({ error: "decidedBy must be a string" });
      }
      update.decidedBy = decidedBy.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return res.status(400).json({ error: "description must be a non-empty string" });
      }
      update.description = description.trim();
    }

    if (type !== undefined) {
      if (!["decision", "approval", "pending_approval"].includes(type)) {
        return res.status(400).json({ error: "Invalid type value" });
      }
      update.type = type;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const decision = await Decision.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!decision) return res.status(404).json({ error: "Decision not found" });
    res.json(decision);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update decision" });
  }
});

// DELETE /api/decisions/:id
router.delete("/decisions/:id", async (req, res) => {
  try {
    const decision = await Decision.findByIdAndDelete(req.params.id);
    if (!decision) return res.status(404).json({ error: "Decision not found" });
    res.json({ message: "Decision deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete decision" });
  }
});

module.exports = router;
