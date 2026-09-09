const { createChatCompletion } = require("../../services/modelClient");
const { getLearningSkill } = require("../prompts/skills");
const { tool } = require("langchain");
const { z } = require("zod");

const REVIEW_QUESTION_SYSTEM_PROMPT =
  getLearningSkill("generate_review_question").systemPrompt;
const REVIEW_ANSWER_SYSTEM_PROMPT =
  getLearningSkill("evaluate_review_answer").systemPrompt;

function parseReviewQuestion(content) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let raw;
  try {
    raw = JSON.parse(fenced ? fenced[1] : content);
  } catch {
    throw new Error("复习题目不是有效 JSON");
  }
  const parsed = z.object({ question: z.string().trim().min(1).max(1000) }).safeParse(raw);
  if (!parsed.success) throw new Error("复习题目为空");
  return parsed.data.question;
}

function createLearningReviewQuestionGenerator({
  chatCompletion = createChatCompletion,
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
    if (!generated) throw new Error("Chat model 返回复习题目为空");
    return parseReviewQuestion(generated);
  };
}

function parseReviewEvaluation(content) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let raw;
  try {
    raw = JSON.parse(fenced ? fenced[1] : content);
  } catch {
    throw new Error("复习评估不是有效 JSON");
  }
  const parsed = z.object({
    state: z.enum(["mastered", "review", "confusing"]),
    feedback: z.string().trim().min(1).max(2000),
  }).safeParse(raw);
  if (!parsed.success) throw new Error("复习评估结果格式无效");
  return parsed.data;
}

function createLearningReviewEvaluator({
  chatCompletion = createChatCompletion,
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
    if (!generated) throw new Error("Chat model 返回复习评估为空");
    return parseReviewEvaluation(generated);
  };
}

function createReviewTools({
  generateQuestion,
  evaluateAnswer,
} = {}) {
  const questionTool = tool(
    async ({ topic, content, explanationLevel }) =>
      JSON.stringify({
        question: await (generateQuestion || generateLearningReviewQuestion)({
          topic,
          content,
          explanationLevel,
        }),
      }),
    {
      name: "generate_review_question",
      description: "根据学习知识点生成一道开放式主动回忆题。",
      schema: z.object({
        topic: z.string().min(1),
        content: z.string().min(1),
        explanationLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      }),
    },
  );
  const evaluationTool = tool(
    async ({ topic, content, question, answer }) =>
      JSON.stringify(await (evaluateAnswer || evaluateLearningReview)({
        topic,
        content,
        question,
        answer,
      })),
    {
      name: "evaluate_review_answer",
      description: "根据知识点、复习题和用户回答判断掌握程度，并给出反馈。",
      schema: z.object({
        topic: z.string().min(1),
        content: z.string().min(1),
        question: z.string().min(1),
        answer: z.string().min(1),
      }),
    },
  );
  return [questionTool, evaluationTool];
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
  createReviewTools,
  evaluateLearningReview,
};
