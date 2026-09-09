const {
  REVIEW_INTERVAL_DAYS,
  LEARNING_STATES,
  createMemoryReviewSchedule,
  recordLearningReview,
} = require("../persistence/memory");

describe("learning review schedule", () => {
  const now = new Date("2026-09-07T00:00:00.000Z");

  it("schedules a forgotten item for the next day and resets its streak", () => {
    expect(createMemoryReviewSchedule({ state: "confusing", reviewCount: 3, now })).toMatchObject({
      reviewCount: 0,
      nextReviewAt: new Date("2026-09-08T00:00:00.000Z"),
    });
  });

  it("extends the interval after each remembered review", () => {
    const schedule = createMemoryReviewSchedule({ state: "mastered", reviewCount: 1, now });
    expect(REVIEW_INTERVAL_DAYS).toEqual([3, 7, 14, 30]);
    expect(schedule).toMatchObject({
      reviewCount: 2,
      nextReviewAt: new Date("2026-09-14T00:00:00.000Z"),
    });
  });

  it("rejects a missing or invalid review evaluation state before writing memory", async () => {
    expect(LEARNING_STATES).toEqual(["mastered", "review", "confusing"]);
    await expect(recordLearningReview({
      userId: "user-1",
      learningUnitId: "topic-rag",
    })).rejects.toThrow("复习结果状态无效");
    await expect(recordLearningReview({
      userId: "user-1",
      learningUnitId: "topic-rag",
      state: "unknown",
    })).rejects.toThrow("复习结果状态无效");
  });
});
