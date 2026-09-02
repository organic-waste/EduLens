const { createAgent, tool } = require("langchain");
const { ChatOpenAI } = require("@langchain/openai");
const { z } = require("zod");
const { getModelConfig } = require("./modelClient");
const { searchLearningKnowledge } = require("./learningSearch");
const { updateLearningMemory } = require("./learningMemoryService");
const { getLearningSkill } = require("./learningSkills");

const MAX_TOOL_ROUNDS = 3;
const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_CHARACTERS = 6000;
const ANSWER_SKILL = getLearningSkill("answer_from_summary");
const LEARNING_TOOL_NAMES = ANSWER_SKILL.allowedTools;

function buildSystemPrompt(profile = {}) {
  const depth = profile.answerDepth || "balanced";
  return [
    ANSWER_SKILL.systemPrompt,
    `回答深度：${depth}。`,
    profile.preferExamples ? "回答偏好：在有证据时使用简短示例。" : "",
    profile.preferInterviewView ? "回答偏好：补充面试表达。" : "",
    profile.targetDirection ? `用户目标方向：${profile.targetDirection}。` : "",
    profile.experienceLevel ? `用户经验等级：${profile.experienceLevel}。` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function toCitations(results) {
  return results.map((result) => ({
    summaryId: result.metadata.summaryId,
    summaryTitle: result.metadata.summaryTitle,
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
  const messages = history.slice(-MAX_HISTORY_MESSAGES).flatMap((item) => {
    if (
      !item ||
      !["user", "assistant"].includes(item.role) ||
      typeof item.content !== "string"
    ) {
      throw new Error("history contains an invalid message");
    }
    const content = item.content.trim();
    return content ? [{ role: item.role, content }] : [];
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

function isRecursionLimitError(error) {
  return error?.name === "GraphRecursionError" || /recursion limit/i.test(error?.message || "");
}

function createLearningTools({ userId, activeSummaryId, memories, state, search, updateMemory }) {
  const searchTool = tool(
    async ({ query }) => {
      if (state.searched) return JSON.stringify({ error: "本轮最多允许一次检索" });
      state.searched = true;
      state.retrieved = await search({ userId, query, activeSummaryId, memories });
      return JSON.stringify({ results: state.retrieved });
    },
    {
      name: "search_learning_knowledge",
      description: "检索当前用户学习摘要库中的知识点和原文引用。教育类知识问题应优先调用。",
      schema: z.object({
        query: z.string().min(1).describe("用于检索学习库的具体问题"),
      }),
    },
  );

  const memoryTool = tool(
    async ({ itemId, state: memoryState }) => {
      if (state.memoryUpdated) return JSON.stringify({ error: "本轮最多允许一次记忆更新" });
      const target = findRetrievedItem(itemId, state.retrieved);
      if (!target) return JSON.stringify({ error: "只能更新本轮已检索的知识点" });

      state.memoryUpdated = true;
      const change = await updateMemory({ userId, itemId, state: memoryState });
      const memoryChange = {
        summaryItemId: itemId,
        topic: target.metadata.topic,
        state: change.state,
      };
      state.memoryChanges.push(memoryChange);
      return JSON.stringify({ accepted: true, memoryChange });
    },
    {
      name: "update_learning_memory",
      description: "仅在用户明确表达掌握、困惑或需要复习时更新本轮已检索知识点的学习状态。",
      schema: z.object({
        itemId: z.string().min(1),
        state: z.enum(["mastered", "confusing", "review"]),
      }),
    },
  );

  return [searchTool, memoryTool];
}

function createLearningModel() {
  const config = getModelConfig().deepseek;
  if (!config.apiKey || config.apiKey.startsWith("YOUR_")) {
    throw new Error("DeepSeek API Key 未配置");
  }
  return new ChatOpenAI({
    apiKey: config.apiKey,
    model: config.model,
    temperature: 0.3,
    configuration: { baseURL: config.baseUrl },
  });
}

function createLangChainAgent({ profile, tools, model = createLearningModel() }) {
  return createAgent({
    model,
    tools,
    systemPrompt: buildSystemPrompt(profile),
  });
}

function createLearningAgent({
  search = searchLearningKnowledge,
  updateMemory = updateLearningMemory,
  agentFactory = createLangChainAgent,
} = {}) {
  async function* streamChat({ userId, message, activeSummaryId, profile, memories, history }) {
    if (!userId) throw new Error("userId is required");
    if (!message?.trim()) throw new Error("message is required");

    const state = {
      searched: false,
      memoryUpdated: false,
      retrieved: [],
      memoryChanges: [],
    };
    const tools = createLearningTools({
      userId,
      activeSummaryId,
      memories,
      state,
      search,
      updateMemory,
    });
    const agent = await agentFactory({ profile, tools });
    const run = await agent.streamEvents(
      {
        messages: [...normalizeConversationHistory(history), { role: "user", content: message.trim() }],
      },
      {
        version: "v3",
        // A model/tool cycle consumes two graph steps. The extra two steps allow a final answer.
        recursionLimit: MAX_TOOL_ROUNDS * 2 + 2,
      },
    );

    let answer = "";
    try {
      for await (const assistantMessage of run.messages) {
        for await (const token of assistantMessage.text) {
          if (!token) continue;
          answer += token;
          yield { type: "delta", content: token };
        }
      }
      await run.output;
    } catch (error) {
      if (!isRecursionLimitError(error)) throw error;
      const limitResult = createChatResult("已完成学习库检索，但工具调用轮次已达到上限。", state);
      if (!answer) yield { type: "delta", content: limitResult.answer };
      yield { type: "done", ...limitResult };
      return;
    }
    yield { type: "done", ...createChatResult(answer, state) };
  }

  return { stream: streamChat };
}

const chatWithLearningAgent = createLearningAgent();

module.exports = {
  LEARNING_TOOL_NAMES,
  MAX_TOOL_ROUNDS,
  MAX_HISTORY_MESSAGES,
  MAX_HISTORY_CHARACTERS,
  buildSystemPrompt,
  createLearningTools,
  isRecursionLimitError,
  normalizeConversationHistory,
  createLearningAgent,
  chatWithLearningAgent,
};
