const { randomUUID } = require("crypto");
const mongoose = require("mongoose");
const { createSiliconFlowEmbeddings } = require("../../services/modelClient");

const VECTOR_COLLECTION = process.env.ATLAS_VECTOR_COLLECTION || "learning_vectors";
const VECTOR_INDEX = process.env.ATLAS_VECTOR_INDEX || "learning_vector_index";
const VECTOR_DIMENSIONS = Number(process.env.ATLAS_VECTOR_DIMENSIONS || 1024);

function vectorCollection() {
  const database = mongoose.connection.db;
  if (!database) throw new Error("MongoDB 尚未连接，无法执行向量检索");
  return database.collection(VECTOR_COLLECTION);
}

function createLearningVectorDocuments(summary, userId) {
  const summaryId = String(summary._id || summary.id);
  return (summary.groups || []).flatMap((group) =>
    (group.items || []).flatMap((item) => {
      if (!item.content?.trim()) return [];
      const isGenerated = item.sourceType === "ai-supplement";
      const citation = item.citation || {};
      return {
        _id: randomUUID(),
        userId: String(userId),
        summaryId,
        summaryTitle: summary.title,
        summaryItemId: item.id,
        topic: group.topic,
        content: item.content,
        sourceType: isGenerated ? "ai-supplement" : "source-backed",
        evidenceLevel: isGenerated ? "generated" : "source-backed",
        pageUrl: citation.pageUrl,
        quote: citation.quote,
        selector: citation.selector,
        prefix: citation.prefix,
        suffix: citation.suffix,
        textPosition: citation.textPosition,
        updatedAt: summary.updatedAt || new Date(),
      };
    }),
  );
}

function toEmbeddingText({ topic, content }) {
  // quote 是定位证据，不应改变知识点的语义相似度。
  return [topic, content].filter(Boolean).join("\n");
}

async function embedTexts(texts) {
  if (!texts.length) return [];
  const response = await createSiliconFlowEmbeddings(texts);
  const vectors = (response.data || [])
    .slice()
    .sort((left, right) => (left.index || 0) - (right.index || 0))
    .map((item) => item.embedding);
  if (vectors.length !== texts.length || vectors.some((vector) => vector.length !== VECTOR_DIMENSIONS)) {
    throw new Error("Embedding 服务返回的向量数量或维度不符合 Atlas 索引配置");
  }
  return vectors;
}

async function syncSummaryVectors(summary, userId) {
  const documents = createLearningVectorDocuments(summary, userId);
  const collection = vectorCollection();
  const filter = { userId: String(userId), summaryId: String(summary._id || summary.id) };
  if (!documents.length) {
    await collection.deleteMany(filter);
    return 0;
  }

  // 先请求并校验新向量。这样 Embedding 服务失败时，旧索引仍可继续提供检索。
  const vectors = await embedTexts(documents.map(toEmbeddingText));
  await collection.deleteMany(filter);
  await collection.insertMany(documents.map((document, index) => ({
    ...document,
    embedding: vectors[index],
  })));
  return documents.length;
}

async function searchLearningVectors({ userId, query, limit = 12 }) {
  const [queryVector] = await embedTexts([query]);
  return vectorCollection().aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX,
        path: "embedding",
        queryVector,
        numCandidates: Math.max(limit * 10, 100),
        limit,
        filter: { userId: String(userId) },
      },
    },
    {
      $project: {
        _id: 0,
        summaryId: 1,
        summaryTitle: 1,
        summaryItemId: 1,
        topic: 1,
        content: 1,
        sourceType: 1,
        evidenceLevel: 1,
        pageUrl: 1,
        quote: 1,
        selector: 1,
        prefix: 1,
        suffix: 1,
        textPosition: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]).toArray();
}

module.exports = {
  createLearningVectorDocuments,
  searchLearningVectors,
  syncSummaryVectors,
};
