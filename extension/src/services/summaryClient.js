import { apiClient } from "./apiClient.js";
import { authManager } from "./authManager.js";

export async function syncSummaryDocument(document) {
  if (!authManager.isAuthenticated()) return null;
  const payload = { ...document };
  if (!document.remoteId) delete payload.id;
  else payload.id = document.remoteId;
  const response = await apiClient.request("/summaries/upsert", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || result.status !== "success") {
    throw new Error(result.message || "摘要同步失败");
  }
  return result.data.summary;
}

export async function loadRemoteSummaryDocuments() {
  if (!authManager.isAuthenticated()) return [];
  const response = await apiClient.request("/summaries/");
  const result = await response.json();
  if (!response.ok || result.status !== "success") {
    throw new Error(result.message || "摘要加载失败");
  }
  return result.data.summaries || [];
}
