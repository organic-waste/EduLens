const { createLearningAgent, LEARNING_TOOLS } = require("../services/learningAgent");

const searchedResult = [{
  summaryItemId: "item-rag",
  semanticScore: 0.83,
  score: 1.05,
  metadata: {
    summaryId: "summary-rag",
    summaryItemId: "item-rag",
    topic: "RAG",
    pageUrl: "https://example.com/rag",
    quote: "检索后生成",
    selector: "#rag",
  },
}];

function toolCall(name, args, id = "call-1") {
  return { id, type: "function", function: { name, arguments: JSON.stringify(args) } };
}

describe("learning agent", () => {
  it("searches before answering and returns evidence citations", async () => {
    const chatCompletion = vi
      .fn()
      .mockResolvedValueOnce({ choices: [{ message: { tool_calls: [toolCall("search_learning_knowledge", { query: "RAG 是什么" })] } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: "RAG 会先检索，再生成回答。" } }] });
    const search = vi.fn().mockResolvedValue(searchedResult);
    const chat = createLearningAgent({ chatCompletion, search });

    const result = await chat({ userId: "user-1", message: "RAG 是什么" });

    expect(search).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1", query: "RAG 是什么" }));
    expect(result.answer).toContain("先检索");
    expect(result.citations).toEqual([expect.objectContaining({ summaryItemId: "item-rag", quote: "检索后生成" })]);
    expect(chatCompletion).toHaveBeenCalledTimes(2);
  });

  it("rejects memory updates for items absent from this turn's retrieval", async () => {
    const chatCompletion = vi
      .fn()
      .mockResolvedValueOnce({ choices: [{ message: { tool_calls: [toolCall("update_learning_memory", { itemId: "other", state: "review" })] } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: "我无法更新未检索的知识点。" } }] });
    const result = await createLearningAgent({ chatCompletion, search: vi.fn() })({
      userId: "user-1",
      message: "帮我复习",
    });

    const toolMessage = chatCompletion.mock.calls[1][0].messages.find(
      (item) => item.role === "tool",
    );
    expect(JSON.parse(toolMessage.content).error).toContain("已检索");
    expect(result.memoryChanges).toEqual([]);
  });

  it("exposes only the two fixed native tools", () => {
    expect(LEARNING_TOOLS.map((tool) => tool.function.name)).toEqual([
      "search_learning_knowledge",
      "update_learning_memory",
    ]);
  });
});
