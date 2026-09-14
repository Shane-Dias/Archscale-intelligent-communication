const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    source: {
      type: String,
      enum: ["whatsapp", "email", "meeting_transcript", "manual", "other"],
      default: "manual",
    },
    rawText: { type: String, required: true },
    summary: { type: String, default: "" },
    participants: [{ type: String }],
  },
  { timestamps: true }
);

// Full-text search index across raw text and summary
ConversationSchema.index({ rawText: "text", summary: "text" });

module.exports = mongoose.model("Conversation", ConversationSchema);
