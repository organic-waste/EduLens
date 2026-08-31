import { authManager } from "./services/authManager.js";
import {
  loadLearningProfile,
  saveLearningProfile,
  updateLearningMemory,
} from "./services/learningClient.js";
import "./profile.css";

const form = document.getElementById("learning-profile-form");
const statusEl = document.getElementById("save-status");
const memoryListEl = document.getElementById("memory-list");

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
}

function renderAccount(user) {
  document.getElementById("account-name").textContent = user.username;
  document.getElementById("account-email").textContent = user.email;
  document.getElementById("account-created-at").textContent = user.createdAt ? `加入于 ${formatDate(user.createdAt)}` : "";
  document.getElementById("account-avatar").textContent = user.username.slice(0, 1).toLocaleUpperCase();
}

function renderProfile(profile) {
  form.elements.targetDirection.value = profile.targetDirection || "";
  form.elements.experienceLevel.value = profile.experienceLevel;
  form.elements.answerDepth.value = profile.answerDepth;
  form.elements.preferExamples.checked = profile.preferExamples;
  form.elements["preferInterviewView"].checked = Boolean(profile.preferInterviewView);
}

function renderMemories(memories) {
  memoryListEl.innerHTML = "";
  if (!memories.length) {
    memoryListEl.innerHTML = '<p class="empty-copy">还没有学习状态。与 AI 对话或在摘要中学习后，记忆会显示在这里。</p>';
    return;
  }
  memories.forEach((memory) => {
    const item = document.createElement("article");
    item.className = "memory-item";
    const text = document.createElement("div");
    const heading = document.createElement("strong");
    heading.textContent = memory.topic || "知识点";
    const content = document.createElement("p");
    content.textContent = memory.content || memory.summaryItemId;
    text.append(heading, content);
    const select = document.createElement("select");
    [
      ["mastered", "已掌握"],
      ["confusing", "易混淆"],
      ["review", "稍后复习"],
    ].forEach(([value, label]) => {
      const option = new Option(label, value, false, memory.state === value);
      select.add(option);
    });
    select.addEventListener("change", async () => {
      select.disabled = true;
      try {
        await updateLearningMemory(memory.summaryItemId, select.value);
        await refresh();
      } catch (error) {
        statusEl.textContent = error.message;
        select.value = memory.state;
      } finally {
        select.disabled = false;
      }
    });
    item.append(text, select);
    memoryListEl.appendChild(item);
  });
}

async function refresh() {
  const data = await loadLearningProfile();
  renderProfile(data.profile);
  renderMemories(data.memories);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const profile = {
    targetDirection: form.elements.targetDirection.value.trim(),
    experienceLevel: form.elements.experienceLevel.value,
    answerDepth: form.elements.answerDepth.value,
    preferExamples: form.elements.preferExamples.checked,
    preferInterviewView: form.elements.preferInterviewView.checked,
  };
  statusEl.textContent = "保存中…";
  try {
    const result = await saveLearningProfile(profile);
    renderProfile(result.profile);
    statusEl.textContent = "已保存";
  } catch (error) {
    statusEl.textContent = error.message;
  }
});

document.getElementById("close-page").addEventListener("click", () => window.close());

async function initialize() {
  await authManager.init();
  renderAccount(authManager.getUser());
  try {
    await refresh();
  } catch (error) {
    statusEl.textContent = error.message;
  }
}

initialize();
