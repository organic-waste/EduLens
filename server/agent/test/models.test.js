const UserLearningProfile = require("../../models/profile");
const LearningMemory = require("../../models/memory");

describe("learning persistence models", () => {
  it("applies profile defaults and restricts the declared enum values", () => {
    const profile = new UserLearningProfile({ userId: "507f1f77bcf86cd799439011" });
    expect(profile.explanationLevel).toBe("beginner");
    expect(profile.preferExamples).toBe(true);
    expect(UserLearningProfile.schema.path("explanationLevel").enumValues).toEqual([
      "beginner", "intermediate", "advanced",
    ]);
  });

  it("uses a user-scoped unique compound index for learning memory", () => {
    expect(LearningMemory.schema.indexes()).toContainEqual([
      { userId: 1, learningUnitId: 1 },
      { unique: true, background: true },
    ]);
  });
});
