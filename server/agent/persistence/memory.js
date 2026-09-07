const LearningMemory = require("../../models/memory");

const REVIEW_INTERVAL_DAYS = [3, 7, 14, 30];

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function createMemoryReviewSchedule({ state, reviewCount = 0, now = new Date() }) {
  const currentCount = Math.max(0, Number(reviewCount) || 0);
  if (state === "confusing") {
    return { reviewCount: 0, lastReviewedAt: now, nextReviewAt: addDays(now, 1) };
  }
  if (state === "review") {
    return { reviewCount: currentCount, lastReviewedAt: now, nextReviewAt: addDays(now, 1) };
  }
  const nextCount = currentCount + 1;
  const interval = REVIEW_INTERVAL_DAYS[Math.min(nextCount - 1, REVIEW_INTERVAL_DAYS.length - 1)];
  return {
    reviewCount: nextCount,
    lastReviewedAt: now,
    nextReviewAt: addDays(now, interval),
  };
}

async function updateLearningMemory({ userId, learningUnitId, state, now = new Date() }) {
  const existing = await LearningMemory.findOne({ userId, learningUnitId }).lean();
  const schedule = createMemoryReviewSchedule({
    state,
    reviewCount: existing?.reviewCount,
    now,
  });
  return LearningMemory.findOneAndUpdate(
    { userId, learningUnitId },
    { $set: { state, ...schedule } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
  ).lean();
}

async function recordLearningReview({ userId, learningUnitId, remembered, state, now = new Date() }) {
  return updateLearningMemory({
    userId,
    learningUnitId,
    state: state || (remembered ? "mastered" : "confusing"),
    now,
  });
}

module.exports = {
  REVIEW_INTERVAL_DAYS,
  addDays,
  createMemoryReviewSchedule,
  updateLearningMemory,
  recordLearningReview,
};
