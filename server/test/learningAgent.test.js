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
    expect(result.uncovered).toBe(false);
  });

  it("marks an empty search result as uncovered for the client UI", async () => {
    const chatCompletion = vi
      .fn()
      .mockResolvedValueOnce({ choices: [{ message: { tool_calls: [toolCall("search_learning_knowledge", { query: "未知主题" })] } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: "以下是简要说明。" } }] });
    const result = await createLearningAgent({
      chatCompletion,
      search: vi.fn().mockResolvedValue([]),
    })({ userId: "user-1", message: "未知主题是什么" });

    expect(result).toMatchObject({ uncovered: true, citations: [] });
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

  it("persists an explicit long-term response preference", async () => {
    const chatCompletion = vi
      .fn()
      .mockResolvedValueOnce({ choices: [{ message: { tool_calls: [
        toolCall("update_response_preferences", { preferExamples: false }),
      ] } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: "已保存此回答偏好。" } }] });
    const updatePreferences = vi.fn().mockResolvedValue({ preferExamples: false });
    const result = await createLearningAgent({ chatCompletion, updatePreferences })({
      userId: "user-1",
      message: "以后回答请不要默认附示例",
    });

    expect(updatePreferences).toHaveBeenCalledWith({
      userId: "user-1",
      preferences: { preferExamples: false },
    });
    expect(result.preferenceChanges).toEqual([{ fields: ["preferExamples"] }]);
  });

  it("reliably persists the interview Q&A preference from a direct future-answer request", async () => {
    const chatCompletion = vi.fn().mockResolvedValue({
      choices: [{ message: { content: "已保存此回答偏好。" } }],
    });
    const updatePreferences = vi.fn().mockResolvedValue({ includeInterviewQa: true });
    const result = await createLearningAgent({ chatCompletion, updatePreferences })({
      userId: "user-1",
      message: "回答我问的知识点时，在末尾带上面试相关常考题目及对应参考答案",
    });

    expect(updatePreferences).toHaveBeenCalledWith({
      userId: "user-1",
      preferences: { includeInterviewQa: true, preferInterviewView: true },
    });
    expect(result.preferenceChanges).toEqual([{
      fields: ["includeInterviewQa", "preferInterviewView"],
    }]);
  });

  it("exposes only the declared native tools", () => {
    expect(LEARNING_TOOLS.map((tool) => tool.function.name)).toEqual([
      "search_learning_knowledge",
      "update_response_preferences",
      "update_learning_memory",
    ]);
  });
});
