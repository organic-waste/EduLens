/* 标注房间路由 */
const express = require("express");
const Room = require("../models/room");
const Annotation = require("../models/annotation");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/my-rooms", auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [{ owner: req.userId }, { members: req.userId }],
    })
      //通过populate将查询到的用户id转换为用户的名字和邮箱
      .populate("owner", "username email")
      .populate("members", "username email")
      .sort({ updatedAt: -1 });

    res.json({
      status: "success",
      data: rooms || [],
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `获取房间失败：${error.message}`,
    });
  }
});

router.post("/create", auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    const room = new Room({
      name,
      description,
      owner: req.userId,
      members: [req.userId],
    });

    await room.save();
    await room.populate("owner", "username email");

    res.status(201).json({
      status: "success",
      data: { room },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `创建房间失败：${error.message}`,
    });
  }
});

router.post("/join", auth, async (req, res) => {
  try {
    const { shareCode } = req.body;

    const room = await Room.findOne({ shareCode });
    if (!room) {
      return res.status(404).json({
        status: "error",
        message: "房间不存在或分享码无效",
      });
    }

    if (room.members.includes(req.userId)) {
      return res.json({
        status: "success",
        data: { room },
      });
    }

    room.members.push(req.userId);
    await room.save();

    await room.populate("owner", "username email");
    await room.populate("members", "username email");

    res.json({
      status: "success",
      data: { room },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `加入房间失败：${error.message}`,
    });
  }
});

// 生成分享码
router.post("/:roomId/generate-share-code", auth, async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const room = await Room.findOne({
      _id: roomId,
      owner: req.userId,
    });

    if (!room) {
      return res.status(404).json({
        status: "error",
        message: "房间不存在或无权操作",
      });
    }

    const shareCode = room.generateShareCode();
    await room.save();

    res.json({
      status: "success",
      data: { shareCode },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `生成分享码失败：${error.message}`,
    });
  }
});

// 删除房间
router.delete("/:roomId", auth, async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const room = await Room.findOne({
      _id: roomId,
      owner: req.userId,
    });

    if (!room) {
      return res.status(404).json({
        status: "error",
        message: "房间不存在或无权删除",
      });
    }

    await Room.findByIdAndDelete(roomId);
    await Annotation.deleteMany({ roomId: roomId });

    res.json({
      status: "success",
      message: "房间删除成功",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `删除房间失败：${error.message}`,
    });
  }
});

module.exports = router;
