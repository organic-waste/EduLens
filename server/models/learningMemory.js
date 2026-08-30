const mongoose = require("mongoose");

const learningMemorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    summaryItemId: { type: String, required: true },
    state: { type: String, enum: ["mastered", "confusing", "review"], required: true },
    reason: { type: String, default: "" },
  },
  { timestamps: true },
);

learningMemorySchema.index({ userId: 1, summaryItemId: 1 }, { unique: true });

module.exports = mongoose.model("LearningMemory", learningMemorySchema);
