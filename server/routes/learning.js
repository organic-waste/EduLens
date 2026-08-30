const express = require("express");
const auth = require("../middleware/auth");
const SummaryDocument = require("../models/summaryDocument");
const UserLearningProfile = require("../models/userLearningProfile");
const TopicInterest = require("../models/topicInterest");
const LearningMemory = require("../models/learningMemory");
const { chatWithLearningAgent } = require("../services/learningAgent");
const { updateLearningMemory, undoLatestLearningMemory } = require("../services/learningMemoryService");

const router = express.Router();
const PROFILE_FIELDS = [
  "targetDirection",
  "experienceLevel",
  "focusTopics",
  "answerDepth",
  "preferExamples",
  "preferInterviewView",
];
const LEARNING_STATES = ["mastered", "confusing", "review"];

function profilePayload(profile) {
  return PROFILE_FIELDS.reduce((result, field) => {
    result[field] = profile[field];
    return result;
  }, {});
}

function validateProfile(body) {
  if (body.experienceLevel && !["beginner", "intermediate", "advanced"].includes(body.experienceLevel)) {
    return "经验等级无效";
  }
  if (body.answerDepth && !["concise", "balanced", "detailed"].includes(body.answerDepth)) {
    return "回答深度无效";
  }
  if (body.focusTopics && (!Array.isArray(body.focusTopics) || body.focusTopics.some((topic) => typeof topic !== "string"))) {
    return "关注主题格式无效";
  }
  return null;
}

async function loadLearningContext(userId) {
  const [profile, topicInterests, memories] = await Promise.all([
    UserLearningProfile.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean(),
    TopicInterest.find({ userId }).sort({ score: -1, topic: 1 }).lean(),
    LearningMemory.find({ userId }).sort({ updatedAt: -1 }).lean(),
  ]);
  return { profile: profilePayload(profile), topicInterests, memories };
}

async function decorateMemories(userId, memories) {
  const summaries = await SummaryDocument.find({ userId }).lean();
  const itemContext = new Map();
  summaries.forEach((summary) => {
    summary.groups.forEach((group) => {
      group.items.forEach((item) => itemContext.set(item.id, {
        summaryId: String(summary._id),
        summaryTitle: summary.title,
        topic: group.topic,
        content: item.content,
        citation: item.citation,
      }));
    });
  });
  return memories.map((memory) => ({ ...memory, ...(itemContext.get(memory.summaryItemId) || {}) }));
}

router.get("/profile", auth, async (req, res) => {
  try {
    const context = await loadLearningContext(req.userId);
    res.json({
      ...context,
      memories: await decorateMemories(req.userId, context.memories),
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: `学习画像加载失败：${error.message}` });
  }
});

router.put("/profile", auth, async (req, res) => {
  const validationError = validateProfile(req.body);
  if (validationError) return res.status(400).json({ status: "error", message: validationError });
  const updates = PROFILE_FIELDS.reduce((result, field) => {
    if (req.body[field] !== undefined) result[field] = req.body[field];
    return result;
  }, {});
  try {
    const profile = await UserLearningProfile.findOneAndUpdate(
      { userId: req.userId },
      { $set: updates, $setOnInsert: { userId: req.userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    ).lean();
    res.json({ profile: profilePayload(profile) });
  } catch (error) {
    res.status(500).json({ status: "error", message: `学习画像保存失败：${error.message}` });
  }
});

router.put("/memory/:summaryItemId", auth, async (req, res) => {
  const { summaryItemId } = req.params;
  const { state, reason = "手动调整" } = req.body;
  if (!LEARNING_STATES.includes(state)) {
    return res.status(400).json({ status: "error", message: "学习状态无效" });
  }
  try {
    const summary = await SummaryDocument.findOne({ userId: req.userId, "groups.items.id": summaryItemId }).lean();
    if (!summary) return res.status(404).json({ status: "error", message: "知识点不存在" });
    const group = summary.groups.find((item) => item.items.some((item) => item.id === summaryItemId));
    const change = await updateLearningMemory({
      userId: req.userId,
      itemId: summaryItemId,
      state,
      topic: group.topic,
      reason,
    });
    res.json({ memory: change.memory });
  } catch (error) {
    res.status(500).json({ status: "error", message: `学习状态保存失败：${error.message}` });
  }
});

router.post("/memory/undo", auth, async (req, res) => {
  try {
    const event = await undoLatestLearningMemory(req.userId);
    if (!event) return res.status(404).json({ status: "error", message: "没有可撤销的学习状态变更" });
    res.json({ undone: true, summaryItemId: event.summaryItemId, state: event.previousState });
  } catch (error) {
    res.status(500).json({ status: "error", message: `撤销学习状态失败：${error.message}` });
  }
});

router.post("/chat", auth, async (req, res) => {
  try {
    const context = await loadLearningContext(req.userId);
    const result = await chatWithLearningAgent({
      userId: req.userId,
      message: req.body.message,
      activeSummaryId: req.body.activeSummaryId,
      ...context,
    });
    res.json(result);
  } catch (error) {
    const isBadRequest = error.message === "message is required";
    res.status(isBadRequest ? 400 : 500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
