/**
 * Builds the extraction prompt sent to Gemini.
 * Keeps the instruction strict so the model returns clean, parseable JSON.
 *
 * @param {string} conversationText - The raw conversation to analyse.
 * @param {Date} [referenceDate=new Date()] - The current date used to resolve
 *   relative deadline expressions such as "by Tuesday" or "next Monday".
 */
function buildExtractionPrompt(conversationText, referenceDate = new Date()) {
  // Format as YYYY-MM-DD in local time so Gemini has an unambiguous anchor.
  const pad = (n) => String(n).padStart(2, "0");
  const today = `${referenceDate.getFullYear()}-${pad(referenceDate.getMonth() + 1)}-${pad(referenceDate.getDate())}`;
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[referenceDate.getDay()];

  return `You are a project communication analyst. Today's date is ${today} (${todayName}).

Read the conversation below and return ONLY a valid JSON object (no markdown
formatting, no code fences, no commentary before or after) in exactly this shape:

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
- Dates must be in YYYY-MM-DD format. Use today's date (${today}) as the reference
  when resolving relative expressions:
    * A specific date (e.g. "March 15th", "15/03") → convert directly to YYYY-MM-DD.
    * "by <weekday>" or "this <weekday>" → the nearest upcoming occurrence of that
      weekday on or after today.
    * "next <weekday>" → the occurrence of that weekday in the following week
      (i.e. at least 7 days out from today).
    * "tomorrow" → ${today} + 1 day.
    * "end of week" → the upcoming Friday.
    * "end of month" → the last day of the current month.
    * If no date can be determined, use null.

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
