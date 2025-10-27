/* 标注房间模型 */
const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  shareCode: {
    type: String,
    unique: true,
    sparse: true,
    default: "",
  },
  isPublic: {
    type: Boolean,
    default: false,
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

roomSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

//生成八位的分享码
roomSchema.methods.generateShareCode = function () {
  const crypto = require("crypto");
  this.shareCode = crypto.randomBytes(4).toString("hex").toUpperCase();
  return this.shareCode;
};

module.exports = mongoose.model("Room", roomSchema);
