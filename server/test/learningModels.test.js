const UserLearningProfile = require("../models/userLearningProfile");
const TopicInterest = require("../models/topicInterest");
const LearningMemory = require("../models/learningMemory");
const LearningMemoryEvent = require("../models/learningMemoryEvent");

describe("learning persistence models", () => {
  it("applies profile defaults and restricts the declared enum values", () => {
    const profile = new UserLearningProfile({ userId: "507f1f77bcf86cd799439011" });
    expect(profile.experienceLevel).toBe("beginner");
    expect(profile.answerDepth).toBe("balanced");
    expect(profile.preferExamples).toBe(true);
    expect(UserLearningProfile.schema.path("experienceLevel").enumValues).toEqual([
      "beginner", "intermediate", "advanced",
    ]);
  });

  it("uses user-scoped unique compound indexes for interest and memory", () => {
    expect(TopicInterest.schema.indexes()).toContainEqual([
      { userId: 1, topic: 1 },
      { unique: true, background: true },
    ]);
    expect(LearningMemory.schema.indexes()).toContainEqual([
      { userId: 1, summaryItemId: 1 },
      { unique: true, background: true },
    ]);
    expect(LearningMemoryEvent.schema.path("previousState").enumValues).toContain("mastered");
  });
});
