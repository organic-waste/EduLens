const learningIndex = require("./learningIndex");

const STATE_BONUS = {
  confusing: 0.2,
  review: 0.12,
  mastered: -0.08,
};

function normalizeKey(value) {
  return String(value || "").trim().toLocaleLowerCase();
}

function toPreferenceMap(userPreferences) {
  if (Array.isArray(userPreferences)) {
    return new Map(
      userPreferences.map((item) => [normalizeKey(item.topic), Number(item.weight) || 0]),
    );
  }
  return new Map(
    Object.entries(userPreferences || {}).map(([topic, weight]) => [
      normalizeKey(topic),
      Number(weight) || 0,
    ]),
  );
}

function toMemoryMap(memories) {
  if (Array.isArray(memories)) {
    return new Map(memories.map((memory) => [String(memory.summaryItemId || memory.itemId), memory]));
  }
  return new Map(Object.entries(memories || {}));
}

function rerankLearningNodes(results, { profile = {}, userPreferences = [], memories = [], activeSummaryId } = {}) {
  const focusTopics = new Set((profile.focusTopics || []).map(normalizeKey));
  const preferences = toPreferenceMap(userPreferences);
  const memoryByItem = toMemoryMap(memories);
  const activeId = activeSummaryId ? String(activeSummaryId) : null;

  return results
    .map((result, index) => {
      const metadata = result.node.metadata || {};
      const topic = normalizeKey(metadata.topic);
      const memory = memoryByItem.get(String(metadata.summaryItemId));
      const semanticScore = Number(result.score) || 0;
      const preferenceWeight = preferences.get(topic) || 0;
      let score = semanticScore;
      if (focusTopics.has(topic)) score += 0.25;
      score += Math.min(Math.max(preferenceWeight, 0), 10) * 0.02;
      score += STATE_BONUS[memory?.state] || 0;
      if (activeId && String(metadata.summaryId) === activeId) score += 0.15;

      return {
        summaryItemId: metadata.summaryItemId,
        content: result.node.getText(),
        score,
        semanticScore,
        metadata: {
          summaryId: metadata.summaryId,
          summaryItemId: metadata.summaryItemId,
          topic: metadata.topic,
          pageUrl: metadata.pageUrl,
          quote: metadata.quote,
          selector: metadata.selector,
          prefix: metadata.prefix,
          suffix: metadata.suffix,
          textPosition: metadata.textPosition,
        },
        _index: index,
      };
    })
    .sort((a, b) => b.score - a.score || a._index - b._index)
    .map(({ _index, ...result }) => result);
}

async function searchLearningKnowledge({
  userId,
  query,
  activeSummaryId,
  profile,
  userPreferences,
  memories,
} = {}) {
  if (!userId) throw new Error("userId is required");
  if (!query?.trim()) throw new Error("query is required");

  const cached = await learningIndex.getUserLearningIndex(userId);
  if (!cached.index) return [];
  const retrieved = await cached.index
    .asRetriever({ similarityTopK: 12 })
    .retrieve(query.trim());
  return rerankLearningNodes(retrieved, {
    profile,
    userPreferences,
    memories,
    activeSummaryId,
  }).slice(0, 4);
}

module.exports = { searchLearningKnowledge, rerankLearningNodes };
