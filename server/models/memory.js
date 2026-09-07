const mongoose = require("mongoose");

const learningMemorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    learningUnitId: { type: String, required: true },
    state: { type: String, enum: ["mastered", "confusing", "review"], required: true },
    reviewCount: { type: Number, default: 0, min: 0 },
    lastReviewedAt: { type: Date },
    nextReviewAt: { type: Date, default: Date.now },
    reviewQuestion: { type: String },
    reviewQuestionContent: { type: String },
  },
  { timestamps: true },
);

learningMemorySchema.index({ userId: 1, learningUnitId: 1 }, { unique: true });

module.exports = mongoose.model("LearningMemory", learningMemorySchema, "learning_topic_memories");
