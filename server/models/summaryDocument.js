const mongoose = require("mongoose");

const summaryDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // 浏览器离线创建摘要时生成的稳定客户端 ID
    clientId: { type: String },
    sourceUrl: { type: String, required: true },
    title: { type: String, required: true },
    groups: { type: Array, default: [] },
    source: { type: Object, default: {} },
  },
  { timestamps: true },
);

summaryDocumentSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("SummaryDocument", summaryDocumentSchema);
