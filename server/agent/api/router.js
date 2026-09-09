const express = require("express");
const auth = require("../../middleware/auth");
const SummaryDocument = require("../../models/summaryDocument");
const UserLearningProfile = require("../../models/profile");
const LearningMemory = require("../../models/memory");
const {
  chatWithLearningAgent,
  normalizeConversationHistory,
  normalizeConversationSummary,
} = require("../application/agent");
const { generateLearningSummary } = require("../application/summary");
const { generateLearningSupplement } = require("../application/supplement");
const {
  createReviewTools,
} = require("../application/review");
const {
  updateLearningMemory,
  recordLearningReview,
} = require("../persistence/memory");
const { logger } = require("../../utils/logger");

const router = express.Router();
const PROFILE_FIELDS = [
  "targetDirection",
  "explanationLevel",
  "summaryDepth",
  "preferExamples",
  "preferInterviewView",
];
const LEARNING_STATES = ["mastered", "confusing", "review"];
const REVIEW_QUEUE_LIMIT = 10;
const REVIEW_QUESTION_CONCURRENCY = 3;
const MAX_MEMORY_ITEMS_PER_UPDATE = 30;
const [reviewQuestionTool, reviewEvaluationTool] = createReviewTools();

function profilePayload(profile) {
  return PROFILE_FIELDS.reduce((result, field) => {
    result[field] = profile[field];
    return result;
  }, {});
}

function validateProfile(body) {
  if (
    body.explanationLevel &&
    !["beginner", "intermediate", "advanced"].includes(body.explanationLevel)
  ) {
    return "讲解等级无效";
  }
  if (
    body.summaryDepth &&
    !["concise", "balanced", "detailed"].includes(body.summaryDepth)
  ) {
    return "摘要详细程度无效";
  }
  return null;
}

async function loadLearningProfile(userId) {
  return UserLearningProfile.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
}

async function loadLearningContext(userId) {
  const [profile, memories] = await Promise.all([
    loadLearningProfile(userId),
    LearningMemory.find({ userId, learningUnitId: { $exists: true } }).sort({ updatedAt: -1 }).lean(),
  ]);
  return { profile: profilePayload(profile), memories };
}

async function decorateMemories(userId, memories) {
  const summaries = await SummaryDocument.find({ userId }).lean();
  const unitContext = new Map();
  summaries.forEach((summary) => {
    summary.groups.forEach((group) => {
      unitContext.set(group.id, {
        summaryId: String(summary._id),
        summaryTitle: summary.title,
        topic: group.topic,
      });
    });
  });
  return memories.map((memory) => {
    const context = unitContext.get(memory.learningUnitId);
    return {
      learningUnitId: memory.learningUnitId,
      state: memory.state,
      topic: context?.topic,
    };
  });
}

async function loadDueReviewCards(userId) {
  const now = new Date();
  const [memories, summaries, profile] = await Promise.all([
    LearningMemory.find({
      userId,
      learningUnitId: { $exists: true },
      $or: [{ nextReviewAt: { $lte: now } }, { nextReviewAt: { $exists: false } }],
    })
      .sort({ nextReviewAt: 1, updatedAt: 1 })
      .limit(REVIEW_QUEUE_LIMIT)
      .lean(),
    SummaryDocument.find({ userId }).lean(),
    loadLearningProfile(userId),
  ]);
  const units = new Map();
  summaries.forEach((summary) => {
    summary.groups.forEach((group) => {
      const content = group.items
        .filter((item) => item.content?.trim())
        .map((item, index) => `${index + 1}. ${item.content}`)
        .join("\n");
      if (!group.id || !content) return;
      units.set(group.id, {
        learningUnitId: group.id,
        topic: group.topic,
        content,
        citation: group.items.find((item) => item.citation?.pageUrl)?.citation,
      });
    });
  });
  const cards = memories.flatMap((memory) => {
    const unit = units.get(memory.learningUnitId);
    return unit ? [{ ...unit, memory, reviewCount: memory.reviewCount || 0 }] : [];
  });
  const results = new Array(cards.length);
  let nextIndex = 0;
  const createFallbackQuestion = (topic) => `请用自己的话解释“${topic}”的核心机制和应用场景。`;
  const worker = async () => {
    while (nextIndex < cards.length) {
      const index = nextIndex;
      nextIndex += 1;
      const card = cards[index];
      const cached =
        card.memory.reviewQuestion && card.memory.reviewQuestionContent === card.content;
      let question = cached ? card.memory.reviewQuestion : createFallbackQuestion(card.topic);
      if (!cached) {
        try {
          const output = await reviewQuestionTool.invoke({
            topic: card.topic,
            content: card.content,
            explanationLevel: profile.explanationLevel,
          });
          question = JSON.parse(output).question;
        } catch (error) {
          logger.warn("learning.review.question_fallback", { userId, error });
        }
        // 摘要被编辑后 content 不匹配，题目会自动重新生成。
        try {
          await LearningMemory.updateOne(
            { _id: card.memory._id, userId },
            { $set: { reviewQuestion: question, reviewQuestionContent: card.content } },
          );
        } catch (error) {
          // 缓存失败不应阻止当天复习；下一次会再次尝试生成并缓存。
          logger.warn("learning.review.question_cache_failed", { userId, error });
        }
      }
      const { memory: _memory, ...reviewCard } = card;
      results[index] = { ...reviewCard, question };
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(REVIEW_QUESTION_CONCURRENCY, cards.length) }, worker),
  );
  return results;
}

router.get("/profile", auth, async (req, res) => {
  try {
    const context = await loadLearningContext(req.userId);
    res.json({
      ...context,
      memories: await decorateMemories(req.userId, context.memories),
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: `学习画像加载失败：${error.message}` });
  }
});

router.put("/profile", auth, async (req, res) => {
  const validationError = validateProfile(req.body);
  if (validationError)
    return res.status(400).json({ status: "error", message: validationError });
  const updates = PROFILE_FIELDS.reduce((result, field) => {
    if (req.body[field] !== undefined) result[field] = req.body[field];
    return result;
  }, {});
  try {
    const profile = await UserLearningProfile.findOneAndUpdate(
      { userId: req.userId },
      { $set: updates, $setOnInsert: { userId: req.userId } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    ).lean();
    res.json({ profile: profilePayload(profile) });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: `学习画像保存失败：${error.message}` });
  }
});

router.put("/memory", auth, async (req, res) => {
  const { learningUnitIds, state } = req.body;
  if (
    !Array.isArray(learningUnitIds) ||
    !learningUnitIds.length ||
    learningUnitIds.length > MAX_MEMORY_ITEMS_PER_UPDATE ||
    learningUnitIds.some((unitId) => typeof unitId !== "string" || !unitId.trim()) ||
    !LEARNING_STATES.includes(state)
  ) {
    return res.status(400).json({ status: "error", message: "学习状态更新参数无效" });
  }
  const unitIds = [...new Set(learningUnitIds)];
  try {
    const summaries = await SummaryDocument.find({ userId: req.userId }).lean();
    const ownedUnitIds = new Set(
      summaries.flatMap((summary) =>
        (summary.groups || []).map((group) => group.id),
      ),
    );
    if (unitIds.some((unitId) => !ownedUnitIds.has(unitId))) {
      return res.status(404).json({ status: "error", message: "学习主题不存在" });
    }
    const memories = await Promise.all(
      unitIds.map((learningUnitId) => updateLearningMemory({
        userId: req.userId,
        learningUnitId,
        state,
      })),
    );
    res.json({ status: "success", memories });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: `学习状态保存失败：${error.message}` });
  }
});

router.put("/memory/:learningUnitId", auth, async (req, res) => {
  const { learningUnitId } = req.params;
  const { state } = req.body;
  if (!LEARNING_STATES.includes(state)) {
    return res.status(400).json({ status: "error", message: "学习状态无效" });
  }
  try {
    const summary = await SummaryDocument.findOne({
      userId: req.userId,
      "groups.id": learningUnitId,
    }).lean();
    if (!summary)
      return res.status(404).json({ status: "error", message: "学习主题不存在" });
    const change = await updateLearningMemory({
      userId: req.userId,
      learningUnitId,
      state,
    });
    // 前端只需确认写入成功；避免暴露一个并不存在的 memory 嵌套字段。
    res.json({ status: "success" });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: `学习状态保存失败：${error.message}` });
  }
});

router.get("/review", auth, async (req, res) => {
  try {
    res.json({ cards: await loadDueReviewCards(req.userId) });
  } catch (error) {
    res.status(500).json({ status: "error", message: `复习队列加载失败：${error.message}` });
  }
});

router.post("/review/:learningUnitId", auth, async (req, res) => {
  const { learningUnitId } = req.params;
  const answer = typeof req.body.answer === "string" ? req.body.answer.trim() : "";
  const question = typeof req.body.question === "string" ? req.body.question.trim() : "";
  if (!answer || !question) {
    return res.status(400).json({ status: "error", message: "复习回答不能为空" });
  }
  try {
    const summary = await SummaryDocument.findOne({
      userId: req.userId,
      "groups.id": learningUnitId,
    }).lean();
    if (!summary)
      return res.status(404).json({ status: "error", message: "学习主题不存在" });
    const group = summary.groups.find((item) => item.id === learningUnitId);
    const content = group.items
      .filter((item) => item.content?.trim())
      .map((item, index) => `${index + 1}. ${item.content}`)
      .join("\n");
    const evaluation = JSON.parse(await reviewEvaluationTool.invoke({
      topic: group.topic,
      content,
      question,
      answer,
    }));
    const memory = await recordLearningReview({
      userId: req.userId,
      learningUnitId,
      state: evaluation.state,
    });
    res.json({ status: "success", evaluation, memory });
  } catch (error) {
    res.status(500).json({ status: "error", message: `复习结果保存失败：${error.message}` });
  }
});

function writeSse(res, event, payload) {
  if (res.writableEnded || res.destroyed) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  res.flush?.();
}

router.post("/chat", auth, async (req, res) => {
  const badRequestMessages = [
    "message is required",
    "history must be an array",
    "history contains an invalid message",
    "history is too long",
    "conversationSummary must be a string",
    "conversationSummary is too long",
  ];
  try {
    if (!req.body.message?.trim()) throw new Error("message is required");
    normalizeConversationHistory(req.body.history);
    normalizeConversationSummary(req.body.conversationSummary);
  } catch (error) {
    if (badRequestMessages.includes(error.message)) {
      return res.status(400).json({ status: "error", message: error.message });
    }
    throw error;
  }
  res.status(200);
  res.set({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();
  writeSse(res, "ready", { status: "ok" });

  try {
    const context = await loadLearningContext(req.userId);
    for await (const event of chatWithLearningAgent.stream({
      userId: req.userId,
      message: req.body.message,
      activeSummaryId: req.body.activeSummaryId,
      activeSummaryTitle: req.body.activeSummaryTitle,
      history: req.body.history,
      conversationSummary: req.body.conversationSummary,
      ...context,
    })) {
      const { type, ...payload } = event;
      writeSse(res, type || "message", payload);
    }
  } catch (error) {
    writeSse(res, "error", { message: error.message });
  } finally {
    if (!res.writableEnded) res.end();
  }
});

router.post("/summarize", auth, async (req, res) => {
  try {
    const { profile } = await loadLearningContext(req.userId);
    const summary = await generateLearningSummary({
      ...req.body,
      summaryDepth: profile.summaryDepth,
    });
    res.json({ summary });
  } catch (error) {
    logger.error("learning.summary.failed", {
      requestId: req.requestId,
      error,
    });
    const isBadRequest = error.message === "摘要来源信息不完整";
    res
      .status(isBadRequest ? 400 : 500)
      .json({ status: "error", message: error.message });
  }
});

router.post("/supplement", auth, async (req, res) => {
  try {
    const profile = await loadLearningProfile(req.userId);
    const { answer, summaryId, summaryTitle, topic, activeItemId } = req.body;
    let resolvedTitle = summaryTitle;
    let resolvedTopic = topic;
    if (summaryId) {
      const summary = await SummaryDocument.findOne({
        _id: summaryId,
        userId: req.userId,
      }).lean();
      if (!summary) {
        return res
          .status(404)
          .json({ status: "error", message: "未找到要补充的摘要" });
      }
      resolvedTitle = summary.title;
      const group = summary.groups.find(
        (item) =>
          item.topic === topic ||
          item.items.some((item) => item.id === activeItemId),
      );
      resolvedTopic = group?.topic || topic;
    }
    const item = await generateLearningSupplement({
      answer,
      summaryTitle: resolvedTitle,
      topic: resolvedTopic,
      summaryDepth: profile.summaryDepth,
    });
    res.json({ supplement: { topic: resolvedTopic, item } });
  } catch (error) {
    const isBadRequest = error.message === "补充摘要所需上下文不完整";
    res
      .status(isBadRequest ? 400 : 500)
      .json({ status: "error", message: error.message });
  }
});

module.exports = router;
