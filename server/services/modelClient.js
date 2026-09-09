const DEFAULT_CHAT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_EMBEDDING_BASE_URL = "https://api.siliconflow.cn/v1";
const DEFAULT_EMBEDDING_MODEL = "BAAI/bge-m3";

function trimBaseUrl(value, fallback) {
  return String(value || fallback).replace(/\/+$/, "");
}

function getModelConfig() {
  return {
    chat: {
      apiKey: process.env.CHAT_API_KEY || "",
      baseUrl: trimBaseUrl(
        process.env.CHAT_BASE_URL,
        DEFAULT_CHAT_BASE_URL,
      ),
      model: process.env.CHAT_MODEL || "deepseek-chat",
    },
    embedding: {
      apiKey: process.env.EMBEDDING_API_KEY || "",
      baseUrl: trimBaseUrl(
        process.env.EMBEDDING_BASE_URL,
        DEFAULT_EMBEDDING_BASE_URL,
      ),
      model: process.env.EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
    },
  };
}

async function postOpenAICompatible({ baseUrl, apiKey, path, body, label }) {
  if (!apiKey || apiKey.startsWith("YOUR_")) {
    throw new Error(`${label} API Key 未配置`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `${label} 请求失败（${response.status}）${detail ? `：${detail.slice(0, 240)}` : ""}`,
    );
  }
  return response.json();
}

function createChatCompletion({ messages, tools, temperature = 0.3 }) {
  const config = getModelConfig().chat;
  return postOpenAICompatible({
    ...config,
    path: "/chat/completions",
    label: "Chat model",
    body: {
      model: config.model,
      messages,
      ...(tools?.length ? { tools } : {}),
      temperature,
      stream: false,
    },
  });
}

function createEmbeddings(input) {
  const config = getModelConfig().embedding;
  return postOpenAICompatible({
    ...config,
    path: "/embeddings",
    label: "Embedding model",
    body: { model: config.model, input },
  });
}

module.exports = {
  DEFAULT_CHAT_BASE_URL,
  DEFAULT_EMBEDDING_BASE_URL,
  DEFAULT_EMBEDDING_MODEL,
  getModelConfig,
  createChatCompletion,
  createEmbeddings,
};
