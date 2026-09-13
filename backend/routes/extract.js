const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Conversation = require("../models/Conversation");
const Task = require("../models/Task");
const Decision = require("../models/Decision");
const { buildExtractionPrompt, parseGeminiJSON } = require("../utils/geminiPrompt");

const router = express.Router();

// Lazily initialize so the app doesn't crash at import time if the key is missing.
function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in .env");
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: "gemini-flash-latest" });
}

/**
 * POST /api/extract
 * Body: { rawText: string, source?: string, participants?: string[] }
 * Sends the raw text to Gemini, parses the structured result, and
 * persists a Conversation + its extracted Tasks + Decisions.
 */
router.post("/extract", async (req, res) => {
  const { rawText, source = "manual", participants = [] } = req.body;

  if (!rawText || !rawText.trim()) {
    return res.status(400).json({ error: "rawText is required" });
  }

  try {
    const model = getModel();
    const prompt = buildExtractionPrompt(rawText);

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let parsed;
    try {
      parsed = parseGeminiJSON(responseText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini response:", responseText);
      return res.status(502).json({
        error: "AI returned an unexpected format. Please try again.",
      });
    }

    const conversation = await Conversation.create({
      source,
      rawText,
      summary: parsed.summary || "",
      participants,
    });

    const tasksToInsert = (parsed.tasks || []).map((t) => ({
      conversationId: conversation._id,
      title: t.title,
      assignee: t.assignee || "Unassigned",
      deadline: t.deadline ? new Date(t.deadline) : null,
    }));

    const decisionsToInsert = (parsed.decisions || []).map((d) => ({
      conversationId: conversation._id,
      type: d.type || "decision",
      description: d.description,
      decidedBy: d.decidedBy || "",
    }));

    const [savedTasks, savedDecisions] = await Promise.all([
      tasksToInsert.length ? Task.insertMany(tasksToInsert) : [],
      decisionsToInsert.length ? Decision.insertMany(decisionsToInsert) : [],
    ]);

    res.status(201).json({
      conversation,
      tasks: savedTasks,
      decisions: savedDecisions,
    });
  } catch (err) {
    console.error("Extraction error:", err.message);
    res.status(500).json({ error: "Extraction failed. Check server logs." });
  }
});

module.exports = router;
