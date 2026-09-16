const express = require("express");
const multer = require("multer");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Project = require("../models/Project");
const Conversation = require("../models/Conversation");
const Task = require("../models/Task");
const Decision = require("../models/Decision");
const { buildExtractionPrompt, parseGeminiJSON } = require("../utils/geminiPrompt");
const { getExtractionErrorResponse } = require("../utils/extractionError");

const router = express.Router();

// ── Multer: memory storage so we never write to disk ────────────────────────
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc (treated as plain-text fallback)
  "text/plain",
  "text/csv",
  "text/markdown",
  "text/x-markdown",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = new Set([".pdf", ".docx", ".doc", ".txt", ".csv", ".md", ".text"]);
    if (ALLOWED_MIME_TYPES.has(file.mimetype) || allowedExts.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype || ext}`));
    }
  },
});

// ── Text extraction helpers ──────────────────────────────────────────────────

async function extractTextFromBuffer(buffer, mimetype, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  // PDF
  if (mimetype === "application/pdf" || ext === ".pdf") {
    const data = await pdfParse(buffer);
    return data.text.trim();
  }

  // DOCX
  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".docx"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  // Plain text / CSV / Markdown / DOC fallback
  return buffer.toString("utf-8").trim();
}

// ── Gemini model factory (same pattern as extract.js) ───────────────────────
function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in .env");
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
}

// Keep uploaded-file extraction consistent with pasted-text extraction.
// Missing or malformed scores remain null so older model responses do not
// prevent otherwise valid tasks and decisions from being saved.
function validateConfidence(score) {
  if (score === undefined || score === null) return null;

  const value = typeof score === "string" ? Number.parseFloat(score) : score;
  if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 1) {
    console.warn(`Invalid confidence score ${score}, defaulting to null`);
    return null;
  }

  return value;
}

const CONV_FIELDS = "source rawText summary participants createdAt fileName";

/**
 * POST /api/extract/file
 * Multipart form fields:
 *   file        – the uploaded file (required)
 *   source      – one of the Conversation source enum values (required)
 *   projectId   – MongoDB ObjectId (required)
 *   participants – JSON-encoded array of strings (optional)
 */
router.post("/extract/file", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "A file is required" });
  }

  const { source = "other", projectId, participants: participantsRaw } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  let participants = [];
  if (participantsRaw) {
    try {
      participants = JSON.parse(participantsRaw);
    } catch {
      // ignore malformed participants
    }
  }

  try {
    // Validate project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Extract text from the uploaded file
    let rawText;
    try {
      rawText = await extractTextFromBuffer(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );
    } catch (extractErr) {
      console.error("File text extraction error:", extractErr.message);
      return res.status(422).json({
        error: `Could not extract text from this file: ${extractErr.message}`,
      });
    }

    if (!rawText) {
      return res.status(422).json({ error: "The file appears to be empty or contains no readable text." });
    }

    // Run Gemini extraction (same pipeline as /api/extract)
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

    // Persist conversation (store rawText + original file name)
    const conversation = await Conversation.create({
      projectId,
      source,
      rawText,
      summary: parsed.summary || "",
      participants,
      fileName: req.file.originalname,
    });

    // Build tasks & decisions (same deadline logic as extract.js)
    const tasksToInsert = (parsed.tasks || []).map((t) => {
      let deadline = null;
      if (t.deadline) {
        const d = new Date(t.deadline);
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
        confidence: validateConfidence(t.confidence),
      };
    });

    const decisionsToInsert = (parsed.decisions || []).map((d) => ({
      projectId,
      conversationId: conversation._id,
      type: d.type || "decision",
      description: d.description,
      decidedBy: d.decidedBy || "",
      confidence: validateConfidence(d.confidence),
    }));

    const [savedTasks, savedDecisions] = await Promise.all([
      tasksToInsert.length ? Task.insertMany(tasksToInsert) : [],
      decisionsToInsert.length ? Decision.insertMany(decisionsToInsert) : [],
    ]);

    // Re-fetch with populate (same fix applied to /api/extract)
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
    console.error("File extraction error:", err.message);
    const response = getExtractionErrorResponse(err);
    res.status(response.status).json({
      error: response.error,
      retryable: response.retryable,
    });
  }
});

// ── Multer error handler ─────────────────────────────────────────────────────
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File is too large. Maximum size is 20 MB." });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
