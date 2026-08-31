import { authManager } from "./services/authManager.js";
import {
  loadLearningProfile,
  saveLearningProfile,
  undoLearningMemory,
  updateLearningMemory,
  createUserPreference,
  updateUserPreference,
  deleteUserPreference,
} from "./services/learningClient.js";
import "./profile.css";

const form = document.getElementById("learning-profile-form");
const statusEl = document.getElementById("save-status");
const preferencesEl = document.getElementById("user-preferences");
const memoryListEl = document.getElementById("memory-list");
const undoButton = document.getElementById("undo-memory");
const addPreferenceButton = document.getElementById("add-preference");

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
  form.elements.focusTopics.value = (profile.focusTopics || []).join(", ");
  form.elements.answerDepth.value = profile.answerDepth;
  form.elements.preferExamples.checked = profile.preferExamples;
  form.elements.preferInterviewView.checked = profile.preferInterviewView;
  form.elements.includeInterviewQa.checked = profile.includeInterviewQa;
}

function createPreferenceEditor(preference = {}) {
  const row = document.createElement("form");
  row.className = "preference-item";
  const topic = document.createElement("input");
  topic.placeholder = "主题，例如 RAG";
  topic.value = preference.topic || "";
  const weight = document.createElement("input");
  weight.type = "number";
  weight.min = "-10";
  weight.max = "10";
  weight.step = "1";
  weight.value = preference.weight ?? 1;
  weight.title = "权重：-10 到 10，越高越优先";
  const save = document.createElement("button");
  save.className = "secondary-button";
  save.type = "submit";
  save.textContent = "保存";
  const remove = document.createElement("button");
  remove.className = "text-danger-button";
  remove.type = "button";
  remove.textContent = "删除";
  row.append(topic, weight, save, remove);
  row.addEventListener("submit", async (event) => {
    event.preventDefault();
    save.disabled = true;
    try {
      const payload = { topic: topic.value.trim(), weight: Number(weight.value) };
      if (preference._id) await updateUserPreference(preference._id, payload);
      else await createUserPreference(payload);
      statusEl.textContent = "用户偏好已保存";
      await refresh();
    } catch (error) {
      statusEl.textContent = error.message;
      save.disabled = false;
    }
  });
  remove.addEventListener("click", async () => {
    if (!preference._id) {
      row.remove();
      return;
    }
    remove.disabled = true;
    try {
      await deleteUserPreference(preference._id);
      statusEl.textContent = "用户偏好已删除";
      await refresh();
    } catch (error) {
      statusEl.textContent = error.message;
      remove.disabled = false;
    }
  });
  return row;
}

function renderUserPreferences(preferences) {
  preferencesEl.innerHTML = "";
  if (!preferences.length) {
    preferencesEl.innerHTML = '<p class="empty-copy">还没有用户偏好。可手动新增，或通过学习交互自动形成。</p>';
    return;
  }
  preferences.forEach((preference) => preferencesEl.appendChild(createPreferenceEditor(preference)));
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
  renderUserPreferences(data.userPreferences);
  renderMemories(data.memories);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const profile = {
    targetDirection: form.elements.targetDirection.value.trim(),
    experienceLevel: form.elements.experienceLevel.value,
    focusTopics: form.elements.focusTopics.value.split(",").map((topic) => topic.trim()).filter(Boolean),
    answerDepth: form.elements.answerDepth.value,
    preferExamples: form.elements.preferExamples.checked,
    preferInterviewView: form.elements.preferInterviewView.checked,
    includeInterviewQa: form.elements.includeInterviewQa.checked,
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

addPreferenceButton.addEventListener("click", () => {
  preferencesEl.querySelector(".empty-copy")?.remove();
  preferencesEl.appendChild(createPreferenceEditor());
});

undoButton.addEventListener("click", async () => {
  undoButton.disabled = true;
  try {
    await undoLearningMemory();
    statusEl.textContent = "已撤销最近变更";
    await refresh();
  } catch (error) {
    statusEl.textContent = error.message;
  } finally {
    undoButton.disabled = false;
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
