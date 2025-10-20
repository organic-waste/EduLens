/* 测试接口 */
const express = require("express");

const router = express.Router();

router.get("/connection", (req, res) => {
  res.json({
    message: "后端服务运行成功",
    timestamp: new Date().toISOString(),
  });
});

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

module.exports = router;
