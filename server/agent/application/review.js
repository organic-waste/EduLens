const { createDeepSeekChatCompletion } = require("../../services/modelClient");
const { getLearningSkill } = require("../prompts/skills");

const REVIEW_QUESTION_SYSTEM_PROMPT =
  getLearningSkill("generate_review_question").systemPrompt;

function parseReviewQuestion(content) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const result = JSON.parse(fenced ? fenced[1] : content);
  const question = String(result?.question || "").trim();
  if (!question) throw new Error("复习题目为空");
  return question;
}

function createLearningReviewQuestionGenerator({
  chatCompletion = createDeepSeekChatCompletion,
} = {}) {
  return async function generateLearningReviewQuestion({
    topic,
    content,
    explanationLevel = "beginner",
  }) {
    if (!topic?.trim() || !content?.trim()) {
      throw new Error("复习题目所需知识点不完整");
    }
    const response = await chatCompletion({
      temperature: 0.4,
      messages: [
        { role: "system", content: REVIEW_QUESTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            topic,
            knowledgePoint: content,
            explanationLevel,
            output: { question: "string" },
          }),
        },
      ],
    });
    const generated = response.choices?.[0]?.message?.content;
    if (!generated) throw new Error("DeepSeek 返回复习题目为空");
    return parseReviewQuestion(generated);
  };
}

const generateLearningReviewQuestion = createLearningReviewQuestionGenerator();

module.exports = {
  REVIEW_QUESTION_SYSTEM_PROMPT,
  parseReviewQuestion,
  createLearningReviewQuestionGenerator,
  generateLearningReviewQuestion,
};
