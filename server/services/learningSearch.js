const learningIndex = require("./learningIndex");

const STATE_BONUS = {
  confusing: 0.2,
  review: 0.12,
  mastered: -0.08,
};

function toMemoryMap(memories) {
  return new Map(memories.map((memory) => [String(memory.summaryItemId), memory]));
}

function rerankLearningNodes(results, { memories = [], activeSummaryId } = {}) {
  const memoryByItem = toMemoryMap(memories);
  const activeId = activeSummaryId ? String(activeSummaryId) : null;

  return results
    .map((result, index) => {
      const metadata = result.node.metadata || {};
      const memory = memoryByItem.get(String(metadata.summaryItemId));
      const semanticScore = Number(result.score) || 0;
      let score = semanticScore;
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
    memories,
    activeSummaryId,
  }).slice(0, 4);
}

module.exports = { searchLearningKnowledge, rerankLearningNodes };
