const mongoose = require("mongoose");

const topicInterestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: String, required: true, trim: true },
    score: { type: Number, default: 0 },
    interactionCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

topicInterestSchema.index({ userId: 1, topic: 1 }, { unique: true });

module.exports = mongoose.model("TopicInterest", topicInterestSchema);
