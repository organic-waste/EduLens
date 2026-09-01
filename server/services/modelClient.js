const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1";
const DEFAULT_EMBEDDING_MODEL = "BAAI/bge-m3";

function trimBaseUrl(value, fallback) {
  return String(value || fallback).replace(/\/+$/, "");
}

function getModelConfig() {
  return {
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || "",
      baseUrl: trimBaseUrl(
        process.env.DEEPSEEK_BASE_URL,
        DEFAULT_DEEPSEEK_BASE_URL,
      ),
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    },
    siliconflow: {
      apiKey: process.env.SILICONFLOW_API_KEY || "",
      baseUrl: trimBaseUrl(
        process.env.SILICONFLOW_BASE_URL,
        DEFAULT_SILICONFLOW_BASE_URL,
      ),
      model: process.env.SILICONFLOW_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
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

function createDeepSeekChatCompletion({ messages, tools, temperature = 0.3 }) {
  const config = getModelConfig().deepseek;
  return postOpenAICompatible({
    ...config,
    path: "/chat/completions",
    label: "DeepSeek",
    body: {
      model: config.model,
      messages,
      ...(tools?.length ? { tools } : {}),
      temperature,
      stream: false,
    },
  });
}

async function* streamOpenAICompatible({ baseUrl, apiKey, path, body, label }) {
  if (!apiKey || apiKey.startsWith("YOUR_")) {
    throw new Error(`${label} API Key 未配置`);
  }
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
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
  if (!response.body) throw new Error(`${label} 未返回可读数据流`);

  const decoder = new TextDecoder();
  let buffer = "";
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() || "";
    for (const event of events) {
      const data = event
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n")
        .trim();
      if (!data || data === "[DONE]") continue;
      try {
        yield JSON.parse(data);
      } catch {
        // Ignore provider keep-alive or non-JSON SSE frames.
      }
    }
  }
  buffer += decoder.decode();
  if (buffer.trim()) {
    const data = buffer
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n")
      .trim();
    if (data && data !== "[DONE]") {
      try {
        yield JSON.parse(data);
      } catch {
        /* provider keep-alive */
      }
    }
  }
}

function createDeepSeekChatCompletionStream({ messages, tools, temperature = 0.3 }) {
  const config = getModelConfig().deepseek;
  return streamOpenAICompatible({
    ...config,
    path: "/chat/completions",
    label: "DeepSeek",
    body: {
      model: config.model,
      messages,
      ...(tools?.length ? { tools } : {}),
      temperature,
      stream: true,
    },
  });
}

function createSiliconFlowEmbeddings(input) {
  const config = getModelConfig().siliconflow;
  return postOpenAICompatible({
    ...config,
    path: "/embeddings",
    label: "SiliconFlow Embedding",
    body: { model: config.model, input },
  });
}

module.exports = {
  DEFAULT_DEEPSEEK_BASE_URL,
  DEFAULT_SILICONFLOW_BASE_URL,
  DEFAULT_EMBEDDING_MODEL,
  getModelConfig,
  createDeepSeekChatCompletion,
  createDeepSeekChatCompletionStream,
  createSiliconFlowEmbeddings,
};
