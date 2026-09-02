const { createLearningSummaryGenerator } = require("../services/learningSummaryService");

describe("learning summary generator", () => {
  const source = {
    text: "RAG 会先检索外部知识，再让模型生成回答。",
    pageTitle: "RAG 入门",
    pageUrl: "https://example.com/rag",
    citation: {
      quote: "RAG 会先检索外部知识，再让模型生成回答。",
      selector: "#content",
      prefix: "前文",
      suffix: "后文",
      textPosition: { start: 10, end: 31 },
    },
  };

  it("generates stable knowledge item ids and preserves citation metadata", async () => {
    const generate = createLearningSummaryGenerator({
      chatCompletion: vi.fn().mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({
          title: "RAG 入门",
          groups: [{ topic: "RAG", items: [{
            content: "RAG 先检索知识后生成回答。",
            quote: "RAG 会先检索外部知识，再让模型生成回答。",
          }] }],
        }) } }],
      }),
    });

    const summary = await generate(source);

    expect(summary.source).toMatchObject({
      pageUrl: source.pageUrl,
      citation: { quote: source.citation.quote, selector: "#content" },
    });
    expect(summary.groups[0].id).toEqual(expect.any(String));
    expect(summary.groups[0].items[0]).toMatchObject({
      id: expect.any(String),
      citation: {
        pageUrl: source.pageUrl,
        quote: "RAG 会先检索外部知识，再让模型生成回答。",
        selector: "#content",
        prefix: "前文",
        suffix: "后文",
        textPosition: { start: 10, end: 31 },
      },
    });
  });

  it("falls back to the selected source when a model quote is not an exact match", async () => {
    const generate = createLearningSummaryGenerator({
      chatCompletion: vi.fn().mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({
          title: "RAG 入门",
          groups: [{ topic: "RAG", items: [{ content: "错误", quote: "不存在的引用" }] }],
        }) } }],
      }),
    });

    const summary = await generate(source);

    expect(summary.groups[0].items[0].quote).toBe(source.text);
    expect(summary.groups[0].items[0].citation.quote).toBe(source.text);
  });
});
