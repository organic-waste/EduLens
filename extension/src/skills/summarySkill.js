import { askAI } from "../services/aiClient.js";

const SUMMARY_SYSTEM_PROMPT = [
  "You are EduLens Summary Skill.",
  "Return JSON only, without Markdown.",
  "Group related knowledge into topics.",
  "Each item must include an exact quote copied from the source.",
  "Do not invent facts.",
].join(" ");

function parseSummary(content) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const summary = JSON.parse(fenced ? fenced[1] : content);
  const groups = summary.groups?.filter(
    (group) => group?.topic && Array.isArray(group.items) && group.items.length,
  );

  if (!summary?.title || !groups?.length) {
    throw new Error("摘要结果格式无效");
  }

  return {
    ...summary,
    groups: groups.map((group) => ({
      ...group,
      id: crypto.randomUUID(),
      items: group.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
    })),
  };
}

export async function generateLearningSummary({ text, pageTitle, pageUrl }) {
  const content = await askAI([
    { role: "system", content: SUMMARY_SYSTEM_PROMPT },
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
  ]);

  return parseSummary(content);
}
