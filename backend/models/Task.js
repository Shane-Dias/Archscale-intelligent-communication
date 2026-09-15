const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    title: { type: String, required: true },
    assignee: { type: String, default: "Unassigned" },
    assigneeRole: { type: String, default: "" },
    deadline: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "in_progress", "done"],
      default: "pending",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

TaskSchema.index({ title: "text" });

module.exports = mongoose.model("Task", TaskSchema);
