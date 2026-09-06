const learningVectors = require(".");

const STATE_BONUS = {
  confusing: 0.2,
  review: 0.12,
  mastered: -0.08,
};
// 原始语义分数先判断一波证据可靠性
const MIN_RELIABLE_SEMANTIC_SCORE = 0.55;

function toMemoryMap(memories) {
  return new Map(
    memories.map((memory) => [String(memory.summaryItemId), memory]),
  );
}

function rerankLearningNodes(results, { memories = [], activeSummaryId } = {}) {
  const memoryByItem = toMemoryMap(memories);
  const activeId = activeSummaryId ? String(activeSummaryId) : null;

  return results
    .map((result, index) => {
      const metadata = result.metadata || result;
      const memory = memoryByItem.get(String(metadata.summaryItemId));
      const semanticScore = Number(result.score) || 0;
      let score = semanticScore;
      score += STATE_BONUS[memory?.state] || 0;
      if (activeId && String(metadata.summaryId) === activeId) score += 0.25;

      return {
        summaryItemId: metadata.summaryItemId,
        content: result.content,
        score,
        semanticScore,
        metadata: {
          summaryId: metadata.summaryId,
          summaryTitle: metadata.summaryTitle,
          summaryItemId: metadata.summaryItemId,
          topic: metadata.topic,
          pageUrl: metadata.pageUrl,
          quote: metadata.quote,
          selector: metadata.selector,
          prefix: metadata.prefix,
          suffix: metadata.suffix,
          textPosition: metadata.textPosition,
          evidenceLevel: metadata.evidenceLevel,
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

  const retrieved = await learningVectors.searchLearningVectors({
    userId,
    query: query.trim(),
    limit: 12,
  });
  return rerankLearningNodes(retrieved, {
    memories,
    activeSummaryId,
  })
    .filter((item) => item.semanticScore >= MIN_RELIABLE_SEMANTIC_SCORE)
    .slice(0, 4);
}

module.exports = {
  MIN_RELIABLE_SEMANTIC_SCORE,
  searchLearningKnowledge,
  rerankLearningNodes,
};
