const mongoose = require("mongoose");

const summaryDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sourceUrl: { type: String, required: true },
    title: { type: String, required: true },
    groups: { type: Array, default: [] },
    source: { type: Object, default: {} },
  },
  { timestamps: true },
);

summaryDocumentSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("SummaryDocument", summaryDocumentSchema);
