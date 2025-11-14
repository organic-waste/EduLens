/* 用户认证路由 */
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const router = express.Router();

//生成JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//直接认证 token 是否有效
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "未提供 token",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "用户不存在",
      });
    }
    res.json({
      status: "success",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    res.status(401).json({
      status: "error",
      message: "Token无效或者已过期",
    });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    //简单校验，确保都存在
    if (!username || !email || !password) {
      return res.status(400).json({
        status: "error",
        message: "请提供用户名、邮箱和密码",
      });
    }
    //防止重复注册
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "用户名或邮箱已存在",
      });
    }
    const newUser = await User.create({ username, email, password });
    console.log("新建用户:", newUser);
    const token = signToken(newUser._id);
    res.status(201).json({
      status: "success",
      token,
      data: {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "注册失败：" + error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "请提供邮箱和密码",
      });
    }
    const user = await User.findOne({ email }).select("+password");
    console.log("登录用户:", user);
    if (!user || !(await user.correctPassword(password))) {
      return res.status(401).json({
        status: "error",
        message: "邮箱或密码不正确",
      });
    }
    const token = signToken(user._id);
    res.json({
      status: "success",
      token,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "登录失败：" + error.message,
    });
  }
});

module.exports = router;
