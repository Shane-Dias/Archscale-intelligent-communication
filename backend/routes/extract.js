const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Project = require("../models/Project");
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
  return genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
}

/**
 * POST /api/extract
 * Body: { rawText: string, source?: string, participants?: string[], projectId: string }
 * Sends the raw text to Gemini, parses the structured result, and
 * persists a Conversation + its extracted Tasks + Decisions.
 */
router.post("/extract", async (req, res) => {
  const { rawText, source = "manual", participants = [], projectId } = req.body;

  if (!rawText || !rawText.trim()) {
    return res.status(400).json({ error: "rawText is required" });
  }

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  try {
    // Validate that the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const model = getModel();
    const prompt = buildExtractionPrompt(rawText, new Date());

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
      projectId,
      source,
      rawText,
      summary: parsed.summary || "",
      participants,
    });

    const tasksToInsert = (parsed.tasks || []).map((t) => {
      let deadline = null;
      if (t.deadline) {
        const d = new Date(t.deadline);
        // new Date("YYYY-MM-DD") parses as UTC midnight; shift to local noon so
        // timezone offsets don't roll the date back by a day when stored.
        if (!isNaN(d.getTime())) {
          deadline = new Date(t.deadline + "T12:00:00");
        }
      }
      return {
        projectId,
        conversationId: conversation._id,
        title: t.title,
        assignee: t.assignee || "Unassigned",
        assigneeRole: t.assigneeRole || "",
        deadline,
      };
    });

    const decisionsToInsert = (parsed.decisions || []).map((d) => ({
      projectId,
      conversationId: conversation._id,
      type: d.type || "decision",
      description: d.description,
      decidedBy: d.decidedBy || "",
    }));

    const [savedTasks, savedDecisions] = await Promise.all([
      tasksToInsert.length ? Task.insertMany(tasksToInsert) : [],
      decisionsToInsert.length ? Decision.insertMany(decisionsToInsert) : [],
    ]);

    // insertMany returns raw documents without populated references.
    // Re-fetch with the same populate projection used by GET /api/tasks and
    // GET /api/decisions so the client can open SourcePreviewModal immediately
    // after extraction without needing a full page refresh.
    const CONV_FIELDS = "source rawText summary participants createdAt";
    const [populatedTasks, populatedDecisions] = await Promise.all([
      savedTasks.length
        ? Task.find({ _id: { $in: savedTasks.map((t) => t._id) } }).populate("conversationId", CONV_FIELDS)
        : [],
      savedDecisions.length
        ? Decision.find({ _id: { $in: savedDecisions.map((d) => d._id) } }).populate("conversationId", CONV_FIELDS)
        : [],
    ]);

    res.status(201).json({
      conversation,
      tasks: populatedTasks,
      decisions: populatedDecisions,
    });
  } catch (err) {
    console.error("Extraction error:", err.message);
    res.status(500).json({ error: "Extraction failed. Check server logs." });
  }
});

module.exports = router;
