const LearningMemory = require("../models/learningMemory");

async function updateLearningMemory({ userId, itemId, state }) {
  return LearningMemory.findOneAndUpdate(
    { userId, summaryItemId: itemId },
    { state },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
  ).lean();
}

module.exports = { updateLearningMemory };
