const { randomUUID } = require("crypto");
const { createDeepSeekChatCompletion } = require("./modelClient");
const { getLearningSkill } = require("./learningSkills");

const SUMMARY_SYSTEM_PROMPT = getLearningSkill("generate_summary").systemPrompt;

function parseSummary(content, { text, pageUrl, citation }) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const summary = JSON.parse(fenced ? fenced[1] : content);
  const groups = summary.groups?.filter(
    (group) => group?.topic && Array.isArray(group.items) && group.items.length,
  );

  if (!summary?.title || !groups?.length) throw new Error("摘要结果格式无效");

  return {
    title: summary.title,
    sourceUrl: pageUrl,
    source: {
      pageUrl,
      citation: { ...citation, pageUrl },
    },
    groups: groups.map((group) => ({
      id: randomUUID(),
      topic: group.topic,
      items: group.items.map((item) => {
        const quote = String(item.quote || "").trim();
        if (!item.content || !quote || !text.includes(quote)) {
          throw new Error("摘要知识点缺少源文本中的准确引用");
        }
        return {
          id: randomUUID(),
          content: item.content,
          quote,
          citation: { ...citation, pageUrl, quote },
        };
      }),
    })),
  };
}

function createLearningSummaryGenerator({ chatCompletion = createDeepSeekChatCompletion } = {}) {
  return async function generateLearningSummary({ text, pageTitle, pageUrl, citation }) {
    if (!text?.trim() || !pageUrl || !citation?.quote) {
      throw new Error("摘要来源信息不完整");
    }
    const response = await chatCompletion({
      temperature: 0.2,
      messages: [
        { role: "system", content: SUMMARY_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            pageTitle,
            pageUrl,
            source: text,
            output: {
              title: "string",
              groups: [{ topic: "string", items: [{ content: "string", quote: "exact source quote" }] }],
            },
          }),
        },
      ],
    });
    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error("DeepSeek 返回内容为空");
    return parseSummary(content, { text, pageUrl, citation });
  };
}

const generateLearningSummary = createLearningSummaryGenerator();

module.exports = {
  SUMMARY_SYSTEM_PROMPT,
  parseSummary,
  createLearningSummaryGenerator,
  generateLearningSummary,
};
