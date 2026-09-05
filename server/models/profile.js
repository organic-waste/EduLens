const mongoose = require("mongoose");

const userLearningProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    targetDirection: { type: String, default: "" },
    experienceLevel: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    answerDepth: { type: String, enum: ["concise", "balanced", "detailed"], default: "balanced" },
    summaryDepth: { type: String, enum: ["concise", "balanced", "detailed"], default: "balanced" },
    preferExamples: { type: Boolean, default: true },
    preferInterviewView: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("UserLearningProfile", userLearningProfileSchema);
