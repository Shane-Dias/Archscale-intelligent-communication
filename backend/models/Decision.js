const mongoose = require("mongoose");

const DecisionSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    type: {
      type: String,
      enum: ["decision", "approval", "pending_approval"],
      default: "decision",
    },
    description: { type: String, required: true },
    decidedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

DecisionSchema.index({ description: "text" });

module.exports = mongoose.model("Decision", DecisionSchema);
