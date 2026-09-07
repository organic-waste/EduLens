const {
  createLearningVectorDocuments,
} = require("../retrieval");

describe("learning vector documents", () => {
  it("creates one retrievable vector document per knowledge item with citation metadata", () => {
    const documents = createLearningVectorDocuments(
      {
        _id: "summary-1",
        title: "RAG 学习笔记",
        sourceUrl: "https://example.com/article",
        groups: [
          {
            id: "topic-rag",
            topic: "RAG",
            items: [
              {
                id: "item-1",
                content: "检索增强生成",
                citation: {
                  pageUrl: "https://example.com/article#rag",
                  quote: "retrieval augmented generation",
                  selector: "#rag",
                  prefix: "before ",
                  suffix: " after",
                  textPosition: { start: 1, end: 29 },
                },
              },
            ],
          },
        ],
      },
      "user-1",
    );

    expect(documents).toHaveLength(1);
    expect(documents[0]).toMatchObject({
      summaryId: "summary-1",
      summaryTitle: "RAG 学习笔记",
      learningUnitId: "topic-rag",
      summaryItemId: "item-1",
      topic: "RAG",
      pageUrl: "https://example.com/article#rag",
      quote: "retrieval augmented generation",
      selector: "#rag",
      prefix: "before ",
      suffix: " after",
      textPosition: { start: 1, end: 29 },
      content: "检索增强生成",
      evidenceLevel: "source-backed",
    });
  });

  it("includes AI supplements as generated, non-citable retrieval documents", () => {
    const documents = createLearningVectorDocuments(
      {
        _id: "summary-1",
        groups: [{
          id: "topic-supplement",
          topic: "AI 补充",
          items: [{
            id: "supplement-1",
            content: "模型生成的普通摘要文本",
            sourceType: "ai-supplement",
          }],
        }],
      },
      "user-1",
    );

    expect(documents).toHaveLength(1);
    expect(documents[0]).toMatchObject({
      summaryItemId: "supplement-1",
      learningUnitId: "topic-supplement",
      evidenceLevel: "generated",
      sourceType: "ai-supplement",
    });
  });
});
