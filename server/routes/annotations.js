/* 标注数据路由 */
const express = require("express");
const Room = require("../models/room");
const Annotation = require("../models/annotation");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/sync", auth, async (req, res) => {
  try {
    const { roomId, pageUrl, annotations } = req.body;

    // 验证用户是否有权限访问该房间
    const room = await Room.findOne({
      _id: roomId,
      members: req.userId,
    });

    if (!room) {
      return res.status(403).json({
        status: "error",
        message: "无权访问此房间",
      });
    }

    let annotation = await Annotation.findOne({
      roomId,
      pageUrl,
    });

    if (annotation) {
      annotation.annotations = annotations;
      annotation.version += 1;
      annotation.lastModified = new Date();
      await annotation.save();
    } else {
      annotation = await Annotation.create({
        roomId,
        pageUrl,
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

// 根据房间ID和URL获取标注数据
router.get("/:roomId/:pageUrl", auth, async (req, res) => {
  try {
    const { roomId, pageUrl } = req.params;

    const room = await Room.findOne({
      _id: roomId,
      members: req.userId,
    });

    if (!room) {
      return res.status(403).json({
        status: "error",
        message: "无权访问此房间",
      });
    }

    const annotation = await Annotation.findOne({
      roomId,
      pageUrl: decodeURIComponent(pageUrl),
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

// 获取房间的所有标注数据
router.get("/:roomId", auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({
      _id: roomId,
      members: req.userId,
    });

    if (!room) {
      return res.status(403).json({
        status: "error",
        message: "无权访问此房间",
      });
    }

    //确保数据库中按更新顺序存储
    const annotations = await Annotation.find({ roomId }).sort({
      updatedAt: -1,
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

module.exports = router;
