const mongoose = require("mongoose");

const userPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: String, required: true, trim: true },
    weight: { type: Number, default: 0, min: -10, max: 10 },
    interactionCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

userPreferenceSchema.index({ userId: 1, topic: 1 }, { unique: true });

module.exports = mongoose.model("UserPreference", userPreferenceSchema);
