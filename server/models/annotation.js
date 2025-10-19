/* 标注数据模型 */
const mongoose = require("mongoose");

const AnnotationSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true,
  },
  pageUrl: {
    type: String,
    required: true,
  },
  annotations: {
    bookmarks: { type: Array, default: [] },
    canvas: { type: String, default: "" },
    rectangles: { type: Array, default: [] },
    images: { type: Array, default: [] },
  },
  version: {
    type: Number,
    default: 1,
  },
  lastModified: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

//确保每个用户每个页面只有一条记录
AnnotationSchema.index({ roomId: 1, pageUrl: 1 }, { unique: true });

AnnotationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Annotation", AnnotationSchema);
