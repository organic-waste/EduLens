import { apiClient } from "./apiClient.js";
import { authManager } from "./authManager.js";

export async function syncSummaryDocument(document) {
  if (!authManager.isAuthenticated()) return null;
  // 前端的 id 与 MongoDB 主键分离：服务端只通过 serverId 判断是否更新。
  const payload = {
    ...document,
    clientId: document.id,
  };
  delete payload.id;
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
