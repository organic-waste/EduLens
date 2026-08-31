const { TextNode, VectorStoreIndex, Settings } = require("llamaindex");
const SummaryDocument = require("../models/summaryDocument");
const { SiliconFlowEmbedding } = require("./siliconFlowEmbedding");

const indexCache = new Map();

function fingerprintSummaries(summaries) {
  return summaries
    .map((summary) => `${summary._id}:${summary.updatedAt?.toISOString?.() || summary.updatedAt || ""}`)
    .sort()
    .join("|");
}

function createLearningNodes(summaries) {
  return summaries.flatMap((summary) => {
    const summaryId = String(summary._id || summary.id);
    return summary.groups.flatMap((group) =>
      group.items.filter((item) => item.sourceType !== "ai-supplement").map((item) => {
        const citation = item.citation || {};
        const text = [group.topic, item.content, citation.quote]
          .filter(Boolean)
          .join("\n");
        return new TextNode({
          id_: item.id,
          text,
          metadata: {
            summaryId,
            summaryItemId: item.id,
            topic: group.topic,
            pageUrl: citation.pageUrl,
            quote: citation.quote,
            selector: citation.selector,
            prefix: citation.prefix,
            suffix: citation.suffix,
            textPosition: citation.textPosition,
          },
        });
      }),
    );
  });
}

async function loadUserSummaries(userId) {
  return SummaryDocument.find({ userId }).lean();
}

async function buildUserLearningIndex(userId, summaries) {
  const nodes = createLearningNodes(summaries);
  if (!nodes.length) {
    const empty = { index: null, nodes, fingerprint: fingerprintSummaries(summaries) };
    indexCache.set(String(userId), empty);
    return empty;
  }

  const embedModel = new SiliconFlowEmbedding();
  Settings.embedModel = embedModel;
  const index = await VectorStoreIndex.init({ nodes });
  const result = { index, nodes, fingerprint: fingerprintSummaries(summaries) };
  indexCache.set(String(userId), result);
  return result;
}

async function getUserLearningIndex(userId, { force = false } = {}) {
  const summaries = await loadUserSummaries(userId);
  const fingerprint = fingerprintSummaries(summaries);
  const cached = indexCache.get(String(userId));
  if (!force && cached?.fingerprint === fingerprint) return cached;
  return buildUserLearningIndex(userId, summaries);
}

function invalidateUserLearningIndex(userId) {
  indexCache.delete(String(userId));
}

module.exports = {
  createLearningNodes,
  getUserLearningIndex,
  invalidateUserLearningIndex,
};
