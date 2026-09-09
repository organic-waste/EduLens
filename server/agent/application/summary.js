const { randomUUID } = require("crypto");
const { z } = require("zod");
const { createDeepSeekChatCompletion } = require("../../services/modelClient");
const { getLearningSkill } = require("../prompts/skills");

const SUMMARY_SYSTEM_PROMPT = getLearningSkill("generate_summary").systemPrompt;
const CITATION_CONTEXT_LENGTH = 80;

const SummaryOutputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  groups: z.array(z.object({
    topic: z.string().trim().min(1).max(100),
    items: z.array(z.object({
      content: z.string().trim().min(1).max(4000),
      quote: z.string().trim().min(1).max(4000),
    })).min(1).max(100),
  })).min(1).max(100),
});

function summaryDepthInstruction(summaryDepth = "balanced") {
  const instructions = {
    concise:
      "Prioritize only the central conclusion of each topic. Keep each item to the minimum wording needed to preserve its meaning.",
    balanced:
      "Cover the main concepts, causal relationships, key steps, and meaningful constraints while omitting repetition.",
    detailed:
      "Preserve useful definitions, mechanisms, conditions, steps, boundaries, and examples when the source supports them.",
  };
  return instructions[summaryDepth] || instructions.balanced;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sourceQuote(text, quote) {
  const candidate = String(quote || "").trim();
  if (!candidate) return null;
  const directIndex = text.indexOf(candidate);
  if (directIndex >= 0)
    return text.slice(directIndex, directIndex + candidate.length);
  // 去掉合并换行或连续空格
  const whitespaceTolerant = new RegExp(
    candidate.split(/\s+/).map(escapeRegExp).join("\\s+"),
  );
  return text.match(whitespaceTolerant)?.[0] || null;
}

function buildItemCitation(text, quote, sourceCitation = {}) {
  const index = text.indexOf(quote);
  if (index < 0) return null;
  const end = index + quote.length;
  const prefix = `${sourceCitation.prefix || ""}${text.slice(0, index)}`.slice(
    -CITATION_CONTEXT_LENGTH,
  );
  const suffix = `${text.slice(end)}${sourceCitation.suffix || ""}`.slice(
    0,
    CITATION_CONTEXT_LENGTH,
  );
  const sourceStart = Number(sourceCitation.textPosition?.start);
  return {
    pageUrl: sourceCitation.pageUrl,
    quote,
    prefix,
    suffix,
    selector: sourceCitation.selector,
    ...(Number.isInteger(sourceStart)
      ? { textPosition: { start: sourceStart + index, end: sourceStart + end } }
      : {}),
  };
}

function parseSummary(content, { text, pageUrl, citation }) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let raw;
  try {
    raw = JSON.parse(fenced ? fenced[1] : content);
  } catch {
    throw new Error("摘要结果不是有效 JSON");
  }
  const parsed = SummaryOutputSchema.safeParse(raw);
  if (!parsed.success) throw new Error("摘要结果格式无效");
  const summary = parsed.data;
  const groups = summary.groups?.filter(
    (group) => group?.topic && Array.isArray(group.items) && group.items.length,
  );

  if (!summary?.title || !groups?.length) throw new Error("摘要结果格式无效");
  const normalizedGroups = groups
    .map((group) => ({
      id: randomUUID(),
      topic: group.topic,
      items: group.items.flatMap((item) => {
        if (!item.content?.trim()) throw new Error("摘要知识点内容为空");
        const quote = sourceQuote(text, item.quote);
        // 没有可验证原文的模型输出不能进入学习库，避免伪造引用污染检索结果
        if (!quote) return [];
        const itemCitation = buildItemCitation(text, quote, {
          ...citation,
          pageUrl,
        });
        if (!itemCitation) return [];
        return [
          {
            id: randomUUID(),
            content: item.content,
            quote,
            citation: itemCitation,
          },
        ];
      }),
    }))
    .filter((group) => group.items.length);
  if (!normalizedGroups.length) throw new Error("摘要结果缺少可验证的原文引用");

  return {
    title: summary.title,
    sourceUrl: pageUrl,
    source: {
      pageUrl,
      citation: { ...citation, pageUrl },
    },
    groups: normalizedGroups,
  };
}

function createLearningSummaryGenerator({
  chatCompletion = createDeepSeekChatCompletion,
} = {}) {
  return async function generateLearningSummary({
    text,
    pageTitle,
    pageUrl,
    citation,
    summaryDepth,
  }) {
    if (!text?.trim() || !pageUrl || !citation?.quote) {
      throw new Error("摘要来源信息不完整");
    }
    const response = await chatCompletion({
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `${SUMMARY_SYSTEM_PROMPT} ${summaryDepthInstruction(summaryDepth)} Do not invent, duplicate, or split facts merely to change summary length.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            pageTitle,
            pageUrl,
            source: text,
            output: {
              title: "string",
              groups: [
                {
                  topic: "string",
                  items: [{ content: "string", quote: "exact source quote" }],
                },
              ],
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
  CITATION_CONTEXT_LENGTH,
  summaryDepthInstruction,
  sourceQuote,
  buildItemCitation,
  parseSummary,
  createLearningSummaryGenerator,
  generateLearningSummary,
};
