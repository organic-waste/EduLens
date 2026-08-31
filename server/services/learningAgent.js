const { createDeepSeekChatCompletion } = require("./modelClient");
const { searchLearningKnowledge } = require("./learningSearch");
const { updateLearningMemory } = require("./learningMemoryService");
const { updateResponsePreferences } = require("./learningProfileService");

const MAX_TOOL_ROUNDS = 3;

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
      name: "update_response_preferences",
      description: "仅当用户明确要求未来回答的格式、示例或面试内容时，更新其长期回答偏好。",
      parameters: {
        type: "object",
        properties: {
          answerDepth: { type: "string", enum: ["concise", "balanced", "detailed"] },
          preferExamples: { type: "boolean" },
          preferInterviewView: { type: "boolean" },
          includeInterviewQa: { type: "boolean", description: "每次知识回答末尾附带面试常考题及参考答案" },
        },
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
          topic: { type: "string" },
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
    "当用户明确要求未来回答的格式、示例或面试内容时，必须调用 update_response_preferences 保存偏好。仅在设置偏好的请求中，工具成功后简短确认，不要追加引导性示例或问题列表。",
    `回答深度：${depth}。`,
    profile.preferExamples ? "用户偏好示例，请在有证据时使用简短示例。" : "",
    profile.includeInterviewQa ? "每次知识讲解末尾必须增加“面试常考题”小节，列出相关问题和对应参考答案。" : "",
    profile.preferInterviewView ? "用户偏好面试视角，请补充面试表达。" : "",
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
    semanticScore: result.semanticScore,
    score: result.score,
  }));
}

function findRetrievedItem(itemId, retrieved) {
  return retrieved.find((item) => item.summaryItemId === itemId);
}

function inferResponsePreferenceUpdate(message) {
  const content = String(message || "");
  const requestsFutureBehavior = /以后|之后|今后|每次|回答.*时/.test(content);
  const requestsInterviewQa = /面试/.test(content)
    && /(常考|题目|问题)/.test(content)
    && /(答案|参考答案)/.test(content);
  return requestsFutureBehavior && requestsInterviewQa
    ? { includeInterviewQa: true, preferInterviewView: true }
    : null;
}

function createChatResult(answer, state) {
  return {
    answer: answer || "暂时无法生成回答，请换一种说法后重试。",
    citations: toCitations(state.retrieved),
    memoryChanges: state.memoryChanges,
    preferenceChanges: state.preferenceChanges,
    uncovered: state.searched && state.retrieved.length === 0,
  };
}

function createLearningAgent({
  chatCompletion = createDeepSeekChatCompletion,
  search = searchLearningKnowledge,
  updateMemory = updateLearningMemory,
  updatePreferences = updateResponsePreferences,
} = {}) {
  return async function chat({ userId, message, activeSummaryId, profile, userPreferences, memories }) {
    if (!userId) throw new Error("userId is required");
    if (!message?.trim()) throw new Error("message is required");

    const messages = [
      { role: "system", content: buildSystemPrompt(profile) },
      { role: "user", content: message.trim() },
    ];
    const state = {
      searched: false,
      memoryUpdated: false,
      preferencesUpdated: false,
      retrieved: [],
      memoryChanges: [],
      preferenceChanges: [],
    };
    const inferredPreferences = inferResponsePreferenceUpdate(message);
    if (inferredPreferences) {
      const profileUpdate = await updatePreferences({ userId, preferences: inferredPreferences });
      state.preferencesUpdated = true;
      state.preferenceChanges.push({ fields: Object.keys(inferredPreferences) });
      messages.push({
        role: "system",
        content: `系统已保存本轮回答偏好：${JSON.stringify(profileUpdate)}。请简短确认，不要追加示例或引导问题。`,
      });
    }

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
              profile,
              userPreferences,
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
                topic: target.metadata.topic,
                reason: `Agent：${message.trim()}`,
              });
              const memoryChange = {
                summaryItemId: args.itemId,
                topic: target.metadata.topic,
                previousState: change.event.previousState,
                state: change.memory.state,
              };
              state.memoryChanges.push(memoryChange);
              output = { accepted: true, memoryChange };
            }
          }
        } else if (call.function?.name === "update_response_preferences") {
          if (state.preferencesUpdated) {
            output = { error: "本轮最多允许一次偏好更新" };
          } else {
            state.preferencesUpdated = true;
            try {
              const profileUpdate = await updatePreferences({ userId, preferences: args });
              const fields = Object.keys(args);
              state.preferenceChanges.push({ fields });
              output = { accepted: true, fields, profile: profileUpdate };
            } catch (error) {
              output = { error: error.message };
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
  buildSystemPrompt,
  createChatResult,
  inferResponsePreferenceUpdate,
  createLearningAgent,
  chatWithLearningAgent,
};
