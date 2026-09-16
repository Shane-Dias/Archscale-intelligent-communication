/**
 * Converts Gemini/provider failures into safe, actionable API responses.
 * Provider error messages can contain implementation details, so only known
 * retryable conditions are surfaced in user-facing text.
 */
function getExtractionErrorResponse(err) {
  const status = err?.status || err?.response?.status || err?.cause?.status;
  const message = String(err?.message || "");
  const isBusy =
    status === 429 ||
    status === 503 ||
    /high load|overloaded|unavailable|resource exhausted|rate limit|too many requests|quota/i.test(message);

  if (isBusy) {
    return {
      status: status === 429 ? 429 : 503,
      error: "Gemini is temporarily busy or experiencing high load. Your content was not saved. Please wait a moment and try extraction again.",
      retryable: true,
    };
  }

  return {
    status: 500,
    error: "Unable to extract tasks and decisions right now. Please try again.",
    retryable: false,
  };
}

module.exports = { getExtractionErrorResponse };
