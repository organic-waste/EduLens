const { randomUUID } = require("crypto");
const { z } = require("zod");
const { createChatCompletion } = require("../../services/modelClient");
const { getLearningSkill } = require("../prompts/skills");
const { summaryDepthInstruction } = require("./summary");

const SUPPLEMENT_SYSTEM_PROMPT =
  getLearningSkill("supplement_summary").systemPrompt;
const SupplementOutputSchema = z.object({
  content: z.string().trim().min(1).max(4000).nullable(),
});

function parseSupplement(content) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let raw;
  try {
    raw = JSON.parse(fenced ? fenced[1] : content);
  } catch {
    throw new Error("补充内容不是有效 JSON");
  }
  const parsed = SupplementOutputSchema.safeParse(raw);
  if (!parsed.success) throw new Error("补充内容格式无效");
  const normalizedContent = parsed.data.content || "";
  if (!normalizedContent) throw new Error("补充内容为空或与当前主题无关");
  return {
    id: randomUUID(),
    content: normalizedContent,
    generated: true,
    sourceType: "ai-supplement",
  };
}

function createLearningSupplementGenerator({
  chatCompletion = createChatCompletion,
} = {}) {
  return async function generateLearningSupplement({
    answer,
    summaryTitle,
    topic,
    summaryDepth,
  }) {
    if (!answer?.trim() || !summaryTitle?.trim() || !topic?.trim()) {
      throw new Error("补充摘要所需上下文不完整");
    }
    const response = await chatCompletion({
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `${SUPPLEMENT_SYSTEM_PROMPT} ${summaryDepthInstruction(summaryDepth)} Do not invent, duplicate, or split facts merely to change summary length.`,
        },
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
    if (!content) throw new Error("Chat model 返回内容为空");
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
