const LearningMemory = require("../models/learningMemory");
const LearningMemoryEvent = require("../models/learningMemoryEvent");
const UserPreference = require("../models/userPreference");

async function updateLearningMemory({ userId, itemId, state, topic, reason = "" }) {
  const previous = await LearningMemory.findOne({ userId, summaryItemId: itemId }).lean();
  const memory = await LearningMemory.findOneAndUpdate(
    { userId, summaryItemId: itemId },
    { state, reason },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
  ).lean();
  const event = await LearningMemoryEvent.create({
    userId,
    summaryItemId: itemId,
    previousState: previous?.state || null,
    nextState: state,
    reason,
  });
  if (topic) {
    await UserPreference.findOneAndUpdate(
      { userId, topic },
      { $inc: { interactionCount: 1, weight: 1 } },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }
  return { memory, event };
}

async function undoLatestLearningMemory(userId) {
  const event = await LearningMemoryEvent.findOne({ userId }).sort({ createdAt: -1 });
  if (!event) return null;
  if (event.previousState) {
    await LearningMemory.findOneAndUpdate(
      { userId, summaryItemId: event.summaryItemId },
      { state: event.previousState, reason: "撤销上次变更" },
      { upsert: true, setDefaultsOnInsert: true },
    );
  } else {
    await LearningMemory.deleteOne({ userId, summaryItemId: event.summaryItemId });
  }
  await LearningMemoryEvent.deleteOne({ _id: event._id });
  return event;
}

module.exports = { updateLearningMemory, undoLatestLearningMemory };
