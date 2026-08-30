const { TextNode } = require("llamaindex");
const fs = require("fs");
const path = require("path");
const learningIndex = require("../services/learningIndex");
const { rerankLearningNodes, searchLearningKnowledge } = require("../services/learningSearch");
const { evaluateRecallAt3 } = require("../evals/retrieval");

function node(id, topic, score, summaryId = "summary-1") {
  return {
    node: new TextNode({
      id_: id,
      text: `${topic} knowledge ${id}`,
      metadata: {
        summaryId,
        summaryItemId: id,
        topic,
        pageUrl: "https://example.com/article",
        quote: id,
        selector: "#content",
      },
    }),
    score,
  };
}

describe("learning search", () => {
  it("keeps fixed evaluation targets aligned with the seed fixture", () => {
    const samples = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../evals/retrievalSamples.json"), "utf8"),
    );
    const fixture = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../evals/retrievalFixture.json"), "utf8"),
    );
    const fixtureIds = new Set(fixture.map((item) => item.itemId));
    expect(samples.every((sample) => fixtureIds.has(sample.targetSummaryItemId))).toBe(true);
  });

  it("reranks focused and confusing topics while preserving semantic score and citation metadata", () => {
    const result = rerankLearningNodes(
      [node("generic", "JavaScript", 0.9), node("focused", "RAG", 0.82)],
      {
        profile: { focusTopics: ["RAG"] },
        memories: [{ summaryItemId: "focused", state: "confusing" }],
      },
    );

    expect(result[0].summaryItemId).toBe("focused");
    expect(result[0].semanticScore).toBe(0.82);
    expect(result[0].metadata).toMatchObject({ summaryItemId: "focused", quote: "focused" });
  });

  it("recalls only the top three results in the fixed evaluator", async () => {
    const samples = [
      { query: "a", targetSummaryItemId: "a" },
      { query: "b", targetSummaryItemId: "b" },
      { query: "c", targetSummaryItemId: "c" },
      { query: "d", targetSummaryItemId: "d" },
      { query: "e", targetSummaryItemId: "e" },
    ];
    const report = await evaluateRecallAt3(samples, async (_query, sample) => [
      { summaryItemId: sample.targetSummaryItemId },
    ]);
    expect(report).toEqual({ hits: 5, total: 5, recallAt3: 1 });
  });

  it("uses semantic top 12 but returns personalized top 4", async () => {
    const retrieve = vi.fn(async () => [
      node("item-1", "JavaScript", 0.99),
      node("item-2", "RAG", 0.8),
      node("item-3", "RAG", 0.79),
      node("item-4", "RAG", 0.78),
      node("item-5", "RAG", 0.77),
    ]);
    vi.spyOn(learningIndex, "getUserLearningIndex").mockResolvedValue({
      index: { asRetriever: vi.fn(() => ({ retrieve })) },
    });

    const result = await searchLearningKnowledge({
      userId: "user-1",
      query: "RAG",
      profile: { focusTopics: ["RAG"] },
    });
    expect(retrieve).toHaveBeenCalledWith("RAG");
    expect(result).toHaveLength(4);
    expect(result[0].metadata.topic).toBe("RAG");
    vi.restoreAllMocks();
  });
});
