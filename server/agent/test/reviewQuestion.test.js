const {
  createLearningReviewQuestionGenerator,
  parseReviewQuestion,
  createLearningReviewEvaluator,
  parseReviewEvaluation,
} = require("../application/review");

describe("learning review question generator", () => {
  it("reads the model's single generated question", () => {
    expect(parseReviewQuestion('{"question":"RAG 中检索步骤的作用是什么？"}')).toBe(
      "RAG 中检索步骤的作用是什么？",
    );
  });

  it("asks the model to create a question from the knowledge point", async () => {
    const chatCompletion = vi.fn().mockResolvedValue({
      choices: [{ message: { content: '{"question":"闭包如何保留外部变量？"}' } }],
    });
    const generate = createLearningReviewQuestionGenerator({ chatCompletion });

    await expect(generate({ topic: "闭包", content: "内部函数可访问外层变量。" })).resolves.toBe(
      "闭包如何保留外部变量？",
    );
    expect(chatCompletion).toHaveBeenCalledWith(expect.objectContaining({
      messages: expect.arrayContaining([
        expect.objectContaining({ content: expect.stringContaining("内部函数可访问外层变量") }),
      ]),
    }));
  });

  it("parses and generates a mastery assessment", async () => {
    expect(parseReviewEvaluation('{"state":"review","feedback":"抓住了核心，但还需复习。"}')).toEqual({
      state: "review",
      feedback: "抓住了核心，但还需复习。",
    });
    const chatCompletion = vi.fn().mockResolvedValue({
      choices: [{ message: { content: '{"state":"mastered","feedback":"回答准确。"}' } }],
    });
    const evaluate = createLearningReviewEvaluator({ chatCompletion });
    await expect(evaluate({
      topic: "RAG",
      content: "先检索再生成。",
      question: "RAG 的流程是什么？",
      answer: "先查资料，再让模型生成答案。",
    })).resolves.toEqual({ state: "mastered", feedback: "回答准确。" });
  });
});
