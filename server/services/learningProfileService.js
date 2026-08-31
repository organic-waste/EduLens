const UserLearningProfile = require("../models/userLearningProfile");

const RESPONSE_PREFERENCE_FIELDS = [
  "answerDepth",
  "preferExamples",
  "preferInterviewView",
  "includeInterviewQa",
];

function pickResponsePreferences(input = {}) {
  return RESPONSE_PREFERENCE_FIELDS.reduce((result, field) => {
    if (input[field] !== undefined) result[field] = input[field];
    return result;
  }, {});
}

async function updateResponsePreferences({ userId, preferences }) {
  const updates = pickResponsePreferences(preferences);
  if (!Object.keys(updates).length) throw new Error("未提供可更新的回答偏好");
  return UserLearningProfile.findOneAndUpdate(
    { userId },
    { $set: updates, $setOnInsert: { userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
  ).lean();
}

module.exports = { RESPONSE_PREFERENCE_FIELDS, pickResponsePreferences, updateResponsePreferences };
