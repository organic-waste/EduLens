const { randomUUID } = require("crypto");
const { createDeepSeekChatCompletion } = require("../../services/modelClient");
const { getLearningSkill } = require("../prompts/skills");

const SUPPLEMENT_SYSTEM_PROMPT =
  getLearningSkill("supplement_summary").systemPrompt;

function parseSupplement(content) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const supplement = JSON.parse(fenced ? fenced[1] : content);
  const normalizedContent = String(supplement?.content || "").trim();
  if (!normalizedContent) throw new Error("补充内容为空或与当前主题无关");
  return {
    id: randomUUID(),
    content: normalizedContent,
    generated: true,
    sourceType: "ai-supplement",
  };
}

function createLearningSupplementGenerator({
  chatCompletion = createDeepSeekChatCompletion,
} = {}) {
  return async function generateLearningSupplement({
    answer,
    summaryTitle,
    topic,
  }) {
    if (!answer?.trim() || !summaryTitle?.trim() || !topic?.trim()) {
      throw new Error("补充摘要所需上下文不完整");
    }
    const response = await chatCompletion({
      temperature: 0.1,
      messages: [
        { role: "system", content: SUPPLEMENT_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            summaryTitle,
            topic,
            candidateAnswer: answer,
            output: { content: "string | null" },
          }),
        },
      ],
    });
    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error("DeepSeek 返回内容为空");
    return parseSupplement(content);
  };
}

const generateLearningSupplement = createLearningSupplementGenerator();

module.exports = {
  SUPPLEMENT_SYSTEM_PROMPT,
  parseSupplement,
  createLearningSupplementGenerator,
  generateLearningSupplement,
};
