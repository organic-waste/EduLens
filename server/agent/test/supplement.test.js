const {
  parseSupplement,
  createLearningSupplementGenerator,
} = require("../application/supplement");

describe("learning supplement skill", () => {
  it("returns a plain AI supplement without inventing a citation", async () => {
    const chatCompletion = vi.fn().mockResolvedValue({
      choices: [{ message: { content: '{"content":"RAG 召回应结合重排序提升结果质量。"}' } }],
    });
    const generate = createLearningSupplementGenerator({
      chatCompletion,
    });

    const item = await generate({
      answer: "RAG 召回应结合重排序提升结果质量。",
      summaryTitle: "RAG 学习笔记",
      topic: "RAG",
      summaryDepth: "concise",
    });

    expect(item).toMatchObject({
      content: "RAG 召回应结合重排序提升结果质量。",
      generated: true,
      sourceType: "ai-supplement",
    });
    expect(item.citation).toBeUndefined();
    expect(chatCompletion.mock.calls[0][0].messages[0].content).toContain("central conclusion");
  });

  it("rejects empty or irrelevant skill output", () => {
    expect(() => parseSupplement('{"content":null}')).toThrow("补充内容为空");
  });
});
