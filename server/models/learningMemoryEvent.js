const mongoose = require("mongoose");

const learningMemoryEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    summaryItemId: { type: String, required: true },
    previousState: { type: String, enum: ["mastered", "confusing", "review", null], default: null },
    nextState: { type: String, enum: ["mastered", "confusing", "review"], required: true },
    reason: { type: String, default: "" },
  },
  { timestamps: true },
);

learningMemoryEventSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("LearningMemoryEvent", learningMemoryEventSchema);
