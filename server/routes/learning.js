const express = require("express");
const auth = require("../middleware/auth");
const { chatWithLearningAgent } = require("../services/learningAgent");

const router = express.Router();

router.post("/chat", auth, async (req, res) => {
  try {
    const result = await chatWithLearningAgent({
      userId: req.userId,
      message: req.body.message,
      activeSummaryId: req.body.activeSummaryId,
    });
    res.json(result);
  } catch (error) {
    const isBadRequest = error.message === "message is required";
    res.status(isBadRequest ? 400 : 500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
