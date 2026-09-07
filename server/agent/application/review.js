const { createDeepSeekChatCompletion } = require("../../services/modelClient");
const { getLearningSkill } = require("../prompts/skills");

const REVIEW_QUESTION_SYSTEM_PROMPT =
  getLearningSkill("generate_review_question").systemPrompt;
const REVIEW_ANSWER_SYSTEM_PROMPT =
  getLearningSkill("evaluate_review_answer").systemPrompt;

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

function parseReviewEvaluation(content) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const result = JSON.parse(fenced ? fenced[1] : content);
  const state = String(result?.state || "").trim();
  if (!["mastered", "review", "confusing"].includes(state)) {
    throw new Error("复习评估状态无效");
  }
  const feedback = String(result?.feedback || "").trim();
  if (!feedback) throw new Error("复习评估反馈为空");
  return { state, feedback };
}

function createLearningReviewEvaluator({
  chatCompletion = createDeepSeekChatCompletion,
} = {}) {
  return async function evaluateLearningReview({ topic, content, question, answer }) {
    if (!topic?.trim() || !content?.trim() || !question?.trim() || !answer?.trim()) {
      throw new Error("复习评估所需内容不完整");
    }
    const response = await chatCompletion({
      temperature: 0,
      messages: [
        { role: "system", content: REVIEW_ANSWER_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            topic,
            knowledgePoint: content,
            question,
            learnerAnswer: answer,
            output: { state: "mastered|review|confusing", feedback: "string" },
          }),
        },
      ],
    });
    const generated = response.choices?.[0]?.message?.content;
    if (!generated) throw new Error("DeepSeek 返回复习评估为空");
    return parseReviewEvaluation(generated);
  };
}

const generateLearningReviewQuestion = createLearningReviewQuestionGenerator();
const evaluateLearningReview = createLearningReviewEvaluator();

module.exports = {
  REVIEW_QUESTION_SYSTEM_PROMPT,
  REVIEW_ANSWER_SYSTEM_PROMPT,
  parseReviewQuestion,
  parseReviewEvaluation,
  createLearningReviewQuestionGenerator,
  generateLearningReviewQuestion,
  createLearningReviewEvaluator,
  evaluateLearningReview,
};
