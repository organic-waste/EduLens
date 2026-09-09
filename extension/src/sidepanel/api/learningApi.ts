import { apiClient } from "../../services/apiClient.js";
import { authManager } from "../../services/authManager.js";
import type {
  ConversationMessage,
  ConversationMemory,
  MemoryChange,
  PageSelection,
  ReviewCard,
  ReviewEvaluation,
  StreamEvent,
  SummaryDocument,
} from "../learning.types";

export interface LearningProfile {
  targetDirection?: string;
  explanationLevel?: "beginner" | "intermediate" | "advanced";
  summaryDepth?: "concise" | "balanced" | "detailed";
  preferExamples?: boolean;
  preferInterviewView?: boolean;
}

export interface LearningContextResponse {
  profile: LearningProfile;
  memories: MemoryChange[];
}

export interface LearningSummarySource extends PageSelection {
  text: string;
}

type LearningRequestOptions = RequestInit;

async function requestLearning(endpoint: string, options: LearningRequestOptions = {}) {
  if (!authManager.isAuthenticated()) {
    throw new Error("登录后使用 AI 学习助手");
  }
  const response = await apiClient.request(`/learning${endpoint}`, options);
  const body = await response.text();
  let result: Record<string, unknown> = {};
  if (body) {
    try {
      result = JSON.parse(body);
    } catch {
      const detail = response.ok
        ? "学习服务返回了非 JSON 成功响应"
        : `学习服务返回了非 JSON 错误响应（HTTP ${response.status}）`;
      throw new Error(`${detail}，请确认后端已重启并部署当前版本`);
    }
  }
  if (!response.ok) {
    const message = typeof result.message === "string" ? result.message : "学习数据请求失败";
    throw new Error(message);
  }
  return result;
}

export function loadLearningProfile(): Promise<LearningContextResponse> {
  return requestLearning("/profile");
}

export function saveLearningProfile(profile: LearningProfile) {
  return requestLearning("/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}

export function updateLearningMemory(learningUnitId: string, state: MemoryChange["state"]) {
  return requestLearning(`/memory/${encodeURIComponent(learningUnitId)}`, {
    method: "PUT",
    body: JSON.stringify({ state }),
  });
}

export function updateLearningMemories(
  learningUnitIds: string[],
  state: MemoryChange["state"],
) {
  return requestLearning("/memory", {
    method: "PUT",
    body: JSON.stringify({ learningUnitIds, state }),
  });
}

export function loadLearningReviewQueue(): Promise<ReviewCard[]> {
  return requestLearning("/review").then((result) => (result.cards as ReviewCard[]) || []);
}

export function submitLearningReview(
  learningUnitId: string,
  question: string,
  answer: string,
): Promise<{ evaluation: ReviewEvaluation }> {
  return requestLearning(`/review/${encodeURIComponent(learningUnitId)}`, {
    method: "POST",
    body: JSON.stringify({ question, answer }),
  }).then((result) => result as { evaluation: ReviewEvaluation });
}

export async function streamLearningAgent({
  message,
  activeSummaryId,
  activeSummaryTitle,
  history,
  conversationSummary,
  onEvent,
  signal,
}: {
  message: string;
  activeSummaryId?: string;
  history?: Array<Pick<ConversationMessage, "role" | "content">>;
  conversationSummary?: ConversationMemory["summary"];
  activeSummaryTitle?: string;
  onEvent?: (event: StreamEvent) => void;
  signal?: AbortSignal;
}): Promise<void> {
  if (!authManager.isAuthenticated()) {
    throw new Error("登录后使用 AI 学习助手");
  }
  const response = await apiClient.request("/learning/chat", {
    method: "POST",
    headers: { Accept: "text/event-stream" },
    body: JSON.stringify({ message, activeSummaryId, activeSummaryTitle, history, conversationSummary }),
    signal,
  });
  if (!response.ok) {
    let result = {};
    try {
      result = await response.json();
    } catch {
      /* non-JSON error */
    }
    throw new Error(result.message || "学习数据请求失败");
  }
  if (!response.body) throw new Error("服务器未返回可读数据流");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const emit = (rawEvent) => {
    const lines = rawEvent.split(/\r?\n/);
    const event =
      lines
        .find((line) => line.startsWith("event:"))
        ?.slice(6)
        .trim() || "message";
    const data = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) return;
    let payload;
    try {
      payload = JSON.parse(data);
    } catch {
      return;
    }
    onEvent?.({ type: event, ...payload });
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() || "";
    events.forEach(emit);
    if (done) break;
  }
  if (buffer.trim()) emit(buffer);
}

export function generateLearningSummary(source: LearningSummarySource): Promise<SummaryDocument> {
  return requestLearning("/summarize", {
    method: "POST",
    body: JSON.stringify(source),
  }).then((result) => result.summary);
}

export function generateLearningSupplement(source: Record<string, unknown>) {
  return requestLearning("/supplement", {
    method: "POST",
    body: JSON.stringify(source),
  }).then((result) => result.supplement);
}
