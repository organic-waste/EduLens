import { apiClient } from "./apiClient.js";
import { authManager } from "./authManager.js";

async function requestLearning(endpoint, options = {}) {
  if (!authManager.isAuthenticated()) {
    throw new Error("登录后使用 AI 学习助手");
  }
  const response = await apiClient.request(`/learning${endpoint}`, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "学习数据请求失败");
  return result;
}

export function loadLearningProfile() {
  return requestLearning("/profile");
}

export function saveLearningProfile(profile) {
  return requestLearning("/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}

export function updateLearningMemory(summaryItemId, state) {
  return requestLearning(`/memory/${encodeURIComponent(summaryItemId)}`, {
    method: "PUT",
    body: JSON.stringify({ state }),
  });
}

export function createUserPreference(preference) {
  return requestLearning("/preferences", {
    method: "POST",
    body: JSON.stringify(preference),
  });
}

export function updateUserPreference(preferenceId, preference) {
  return requestLearning(`/preferences/${encodeURIComponent(preferenceId)}`, {
    method: "PUT",
    body: JSON.stringify(preference),
  });
}

export function deleteUserPreference(preferenceId) {
  return requestLearning(`/preferences/${encodeURIComponent(preferenceId)}`, {
    method: "DELETE",
  });
}

export function undoLearningMemory() {
  return requestLearning("/memory/undo", { method: "POST" });
}

export function chatWithLearningAgent({ message, activeSummaryId }) {
  return requestLearning("/chat", {
    method: "POST",
    body: JSON.stringify({ message, activeSummaryId }),
  });
}

export function generateLearningSummary(source) {
  return requestLearning("/summarize", {
    method: "POST",
    body: JSON.stringify(source),
  }).then((result) => result.summary);
}
