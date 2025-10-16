/* 涂鸦标注路由 */
const express = require("express");
const Annotation = require("../models/annotation");
const {
  updateLoginStatus,
} = require("../../extension/src/features/accounts/login");
const { model } = require("mongoose");

const router = express.Router();

//更新标注数据
router.post("/sync", protect, async (req, res) => {
  try {
    const { pageUrl, pageTitle, annotations } = req.body;
    const userId = req.userId;

    let annotation = await Annotation.findOne({
      userId,
      pageUrl,
    });
    if (annotation) {
      annotation.annotations = annotations;
      annotation.pageTitle = pageTitle;
      await annotation.save();
    } else {
      annotation = await Annotation.create({
        userId,
        pageUrl,
        pageTitle,
        annotations,
      });
    }
    res.json({
      status: "success",
      data: { annotation },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `同步失败：${error.message}`,
    });
  }
});

//获取所有标注
router.get("/by-id", async (req, res) => {
  try {
    const userId = req.userId;
    const annotations = (await Annotation.find({ userId })).toSorted({
      updateAt: -1,
    });

    res.json({
      status: "success",
      data: {
        annotations,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `获取标注失败：${error.message}`,
    });
  }
});

// 根据URL获取特定标注
router.get("/by-url", async (req, res) => {
  try {
    const { url } = req.query;
    const userId = req.userId;
    if (!url) {
      return res.status(400).json({
        status: "error",
        message: "请传递url参数",
      });
    }
    const annotation = await Annotation.findOne({
      userId,
      pageUrl: url,
    });

    res.json({
      status: "success",
      data: {
        annotation: annotation,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `获取标注失败：${error.message}`,
    });
  }
});

module.exports = router;
