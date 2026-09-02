const {
  CITATION_CONTEXT_LENGTH,
  createLearningSummaryGenerator,
} = require("../services/learningSummaryService");

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
        textPosition: { start: 10, end: 32 },
      },
    });
  });

  it("does not index a model item whose quote is not present in the selected source", async () => {
    const generate = createLearningSummaryGenerator({
      chatCompletion: vi.fn().mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({
          title: "RAG 入门",
          groups: [{ topic: "RAG", items: [{ content: "错误", quote: "不存在的引用" }] }],
        }) } }],
      }),
    });

    await expect(generate(source)).rejects.toThrow("可验证的原文引用");
  });

  it("uses a per-quote bounded context anchor and corrected text offsets", async () => {
    const selectedText = `开头${"甲".repeat(100)}目标引用${"乙".repeat(100)}结尾`;
    const generate = createLearningSummaryGenerator({
      chatCompletion: vi.fn().mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({
          title: "锚点",
          groups: [{ topic: "测试", items: [{ content: "内容", quote: "目标引用" }] }],
        }) } }],
      }),
    });
    const summary = await generate({
      ...source,
      text: selectedText,
      citation: { ...source.citation, prefix: "选区前", suffix: "选区后", textPosition: { start: 50, end: 50 + selectedText.length } },
    });
    const citation = summary.groups[0].items[0].citation;
    expect(citation.prefix).toHaveLength(CITATION_CONTEXT_LENGTH);
    expect(citation.suffix).toHaveLength(CITATION_CONTEXT_LENGTH);
    expect(citation.textPosition).toEqual({ start: 152, end: 156 });
  });
});
