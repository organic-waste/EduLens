// 涂鸦标注模型
const mongoose = require("mongoose");

const annotationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  pageUrl: {
    type: String,
    required: true,
  },
  pageTitle: String,
  annotations: {
    type: mongoose.Schema.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date,
    default: Date.now,
  },
});

//确保每个用户每个页面只有一条记录
annotationSchema.index({ userId: 1, pageUrl: 1 }, { unique: true });

//更新标注时自动更新updatedAt
annotationSchema.pre("save", function (next) {
  this.updateAt = Date.now();
  next();
});

module.exports = mongoose.model("Annotation", annotationSchema);
