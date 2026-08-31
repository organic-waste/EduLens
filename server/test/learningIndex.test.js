const { createLearningNodes } = require("../services/learningIndex");

describe("learning index nodes", () => {
  it("creates one retrievable node per knowledge item with citation metadata", () => {
    const nodes = createLearningNodes([
      {
        _id: "summary-1",
        sourceUrl: "https://example.com/article",
        groups: [
          {
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
    ]);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].id_).toBe("item-1");
    expect(nodes[0].getText()).toContain("检索增强生成");
    expect(nodes[0].metadata).toMatchObject({
      summaryId: "summary-1",
      summaryItemId: "item-1",
      topic: "RAG",
      pageUrl: "https://example.com/article#rag",
      quote: "retrieval augmented generation",
      selector: "#rag",
      prefix: "before ",
      suffix: " after",
      textPosition: { start: 1, end: 29 },
    });
  });

  it("excludes AI supplements without source citations from the retrieval index", () => {
    const nodes = createLearningNodes([
      {
        _id: "summary-1",
        groups: [{
          topic: "AI 补充",
          items: [{
            id: "supplement-1",
            content: "模型生成的普通摘要文本",
            sourceType: "ai-supplement",
          }],
        }],
      },
    ]);

    expect(nodes).toEqual([]);
  });
});
