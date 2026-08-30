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
    prefix: "before ",
    suffix: " after",
    textPosition: { start: 1, end: 9 },
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
    expect(result.citations).toEqual([expect.objectContaining({
      summaryItemId: "item-rag",
      quote: "检索后生成",
      prefix: "before ",
      suffix: " after",
      textPosition: { start: 1, end: 9 },
    })]);
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

  it("persists an allowed memory update and returns the change", async () => {
    const chatCompletion = vi
      .fn()
      .mockResolvedValueOnce({ choices: [{ message: { tool_calls: [
        toolCall("search_learning_knowledge", { query: "RAG" }, "call-search"),
      ] } }] })
      .mockResolvedValueOnce({ choices: [{ message: { tool_calls: [
        toolCall("update_learning_memory", { itemId: "item-rag", state: "review" }, "call-memory"),
      ] } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: "我已将这个知识点标记为稍后复习。" } }] });
    const updateMemory = vi.fn().mockResolvedValue({
      memory: { summaryItemId: "item-rag", state: "review" },
      event: { previousState: null },
    });
    const result = await createLearningAgent({
      chatCompletion,
      search: vi.fn().mockResolvedValue(searchedResult),
      updateMemory,
    })({ userId: "user-1", message: "RAG 我需要复习" });

    expect(updateMemory).toHaveBeenCalledWith(expect.objectContaining({
      userId: "user-1",
      itemId: "item-rag",
      state: "review",
      topic: "RAG",
    }));
    expect(result.memoryChanges).toEqual([{
      summaryItemId: "item-rag",
      topic: "RAG",
      previousState: null,
      state: "review",
    }]);
  });

  it("exposes only the two fixed native tools", () => {
    expect(LEARNING_TOOLS.map((tool) => tool.function.name)).toEqual([
      "search_learning_knowledge",
      "update_learning_memory",
    ]);
  });
});
