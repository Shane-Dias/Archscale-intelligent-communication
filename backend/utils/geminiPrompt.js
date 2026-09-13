/**
 * Builds the extraction prompt sent to Gemini.
 * Keeps the instruction strict so the model returns clean, parseable JSON.
 */
function buildExtractionPrompt(conversationText) {
  return `You are a project communication analyst. Read the conversation
below and return ONLY a valid JSON object (no markdown formatting,
no code fences, no commentary before or after) in exactly this shape:

{
  "summary": "2-3 sentence summary of the conversation",
  "tasks": [
    { "title": "string", "assignee": "string or Unassigned", "deadline": "YYYY-MM-DD or null" }
  ],
  "decisions": [
    { "type": "decision|approval|pending_approval", "description": "string", "decidedBy": "string" }
  ]
}

Rules:
- If a field is unknown, use null or an empty string. Never invent information not present in the text.
- If there are no tasks, return an empty array for "tasks".
- If there are no decisions or approvals, return an empty array for "decisions".
- Dates must be in YYYY-MM-DD format if a specific date can be inferred, otherwise null.

Conversation:
"""
${conversationText}
"""`;
}

/**
 * Strips markdown code fences that Gemini sometimes adds despite instructions,
 * then safely parses the JSON. Throws if parsing still fails.
 */
function parseGeminiJSON(rawResponseText) {
  const cleaned = rawResponseText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

module.exports = { buildExtractionPrompt, parseGeminiJSON };
