const DEEPSEEK_ENDPOINT =
  import.meta.env.VITE_DEEPSEEK_ENDPOINT ||
  "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL =
  import.meta.env.VITE_DEEPSEEK_MODEL || "deepseek-v4-flash";
// Vite 仅在构建时注入 VITE_ 前缀变量，extension/.env 不会被运行时暴露。
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || "";

export async function askAI(messages, options = {}) {
  if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === "YOUR_DEEPSEEK_API_KEY") {
    throw new Error("尚未配置 DeepSeek API Key");
  }

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature: options.temperature ?? 0.3,
      stream: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `AI 请求失败（${response.status}）${detail ? `：${detail.slice(0, 160)}` : ""}`,
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI 返回内容为空");
  return content;
}
