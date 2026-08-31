const { createDeepSeekChatCompletion } = require("./modelClient");
const { searchLearningKnowledge } = require("./learningSearch");
const { updateLearningMemory } = require("./learningMemoryService");

const MAX_TOOL_ROUNDS = 3;
const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_CHARACTERS = 6000;

const LEARNING_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_learning_knowledge",
      description: "检索当前用户学习摘要库中的知识点和原文引用。教育类知识问题应优先调用。",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "用于检索学习库的具体问题" } },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_learning_memory",
      description: "仅在用户明确表达掌握、困惑或需要复习时更新本轮已检索知识点的学习状态。",
      parameters: {
        type: "object",
        properties: {
          itemId: { type: "string" },
          state: { type: "string", enum: ["mastered", "confusing", "review"] },
        },
        required: ["itemId"],
        additionalProperties: false,
      },
    },
  },
];

function buildSystemPrompt(profile = {}) {
  const depth = profile.answerDepth || "balanced";
  return [
    "你是 EduLens AI 学习助手。",
    "教育类知识问题优先调用 search_learning_knowledge，再基于返回证据回答。",
    "没有学习库证据时，直接基于通用知识回答问题；不要提及学习库、知识库覆盖范围、来源缺失，也不要建议用户加入学习库、展开话题或更新学习状态。",
    "回答必须使用 Markdown 格式输出；不要输出原始 HTML。",
    `回答深度：${depth}。`,
    profile.preferExamples ? "回答偏好：在有证据时使用简短示例。" : "",
    profile.preferInterviewView ? "回答偏好：补充面试表达。" : "",
    profile.targetDirection ? `用户目标方向：${profile.targetDirection}。` : "",
    profile.experienceLevel ? `用户经验等级：${profile.experienceLevel}。` : "",
  ].filter(Boolean).join("\n");
}

function parseArguments(raw) {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return null;
  }
}

function toCitations(results) {
  return results.map((result) => ({
    summaryId: result.metadata.summaryId,
    summaryItemId: result.metadata.summaryItemId,
    topic: result.metadata.topic,
    pageUrl: result.metadata.pageUrl,
    quote: result.metadata.quote,
    selector: result.metadata.selector,
    prefix: result.metadata.prefix,
    suffix: result.metadata.suffix,
    textPosition: result.metadata.textPosition,
  }));
}

function findRetrievedItem(itemId, retrieved) {
  return retrieved.find((item) => item.summaryItemId === itemId);
}

function normalizeConversationHistory(history) {
  if (history === undefined) return [];
  if (!Array.isArray(history)) throw new Error("history must be an array");
  const messages = history.slice(-MAX_HISTORY_MESSAGES).map((item) => {
    if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string") {
      throw new Error("history contains an invalid message");
    }
    const content = item.content.trim();
    if (!content) throw new Error("history contains an empty message");
    return { role: item.role, content };
  });
  const characters = messages.reduce((count, item) => count + item.content.length, 0);
  if (characters > MAX_HISTORY_CHARACTERS) throw new Error("history is too long");
  return messages;
}

function createChatResult(answer, state) {
  return {
    answer: answer || "暂时无法生成回答，请换一种说法后重试。",
    citations: toCitations(state.retrieved),
    memoryChanges: state.memoryChanges,
    uncovered: state.searched && state.retrieved.length === 0,
  };
}

function createLearningAgent({
  chatCompletion = createDeepSeekChatCompletion,
  search = searchLearningKnowledge,
  updateMemory = updateLearningMemory,
} = {}) {
  return async function chat({
    userId,
    message,
    activeSummaryId,
    profile,
    memories,
    history,
  }) {
    if (!userId) throw new Error("userId is required");
    if (!message?.trim()) throw new Error("message is required");
    const historyMessages = normalizeConversationHistory(history);
    const state = {
      searched: false,
      memoryUpdated: false,
      retrieved: [],
      memoryChanges: [],
    };
    const messages = [
      { role: "system", content: buildSystemPrompt(profile) },
      ...historyMessages,
      { role: "user", content: message.trim() },
    ];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const response = await chatCompletion({ messages, tools: LEARNING_TOOLS });
      const assistant = response.choices?.[0]?.message;
      if (!assistant) throw new Error("DeepSeek 返回内容为空");
      const toolCalls = assistant.tool_calls || [];
      messages.push({
        role: "assistant",
        content: assistant.content || "",
        ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
      });

      if (!toolCalls.length) {
        return createChatResult(assistant.content, state);
      }

      for (const call of toolCalls) {
        const args = parseArguments(call.function?.arguments);
        let output;
        if (!args) {
          output = { error: "工具参数不是有效 JSON" };
        } else if (call.function?.name === "search_learning_knowledge") {
          if (state.searched) {
            output = { error: "本轮最多允许一次检索" };
          } else {
            state.searched = true;
            state.retrieved = await search({
              userId,
              query: args.query,
              activeSummaryId,
              memories,
            });
            output = { results: state.retrieved };
          }
        } else if (call.function?.name === "update_learning_memory") {
          if (state.memoryUpdated) {
            output = { error: "本轮最多允许一次记忆更新" };
          } else {
            const target = findRetrievedItem(args.itemId, state.retrieved);
            if (!target) {
              output = { error: "只能更新本轮已检索的知识点" };
            } else if (!args.state) {
              output = { error: "缺少学习状态" };
            } else {
              state.memoryUpdated = true;
              const change = await updateMemory({
                userId,
                itemId: args.itemId,
                state: args.state,
              });
              const memoryChange = {
                summaryItemId: args.itemId,
                topic: target.metadata.topic,
                state: change.state,
              };
              state.memoryChanges.push(memoryChange);
              output = { accepted: true, memoryChange };
            }
          }
        } else {
          output = { error: "未知工具" };
        }
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(output),
        });
      }
    }

    return createChatResult("已完成学习库检索，但工具调用轮次已达到上限。", state);
  };
}

const chatWithLearningAgent = createLearningAgent();

module.exports = {
  LEARNING_TOOLS,
  MAX_TOOL_ROUNDS,
  MAX_HISTORY_MESSAGES,
  MAX_HISTORY_CHARACTERS,
  normalizeConversationHistory,
  createLearningAgent,
  chatWithLearningAgent,
};
