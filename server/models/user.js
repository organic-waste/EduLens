/* 用户信息模型 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
});

//保存前加密
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); //避免修改其他内容时重复哈希

  this.password = await bcrypt.hash(this.password, 12); //12 为saltRounds，成本因子
  next();
});

//校验密码
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model("User", userSchema);
