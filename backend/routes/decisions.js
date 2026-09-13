const express = require("express");
const Decision = require("../models/Decision");

const router = express.Router();

// GET /api/decisions?type=
router.get("/decisions", async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;

    const decisions = await Decision.find(filter)
      .populate("conversationId", "source createdAt")
      .sort({ createdAt: -1 });

    res.json(decisions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch decisions" });
  }
});

module.exports = router;
