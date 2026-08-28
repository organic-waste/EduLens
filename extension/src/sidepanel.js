import { askAI } from "./services/aiClient.js";
import "./sidepanel.css";

const messagesEl = document.getElementById("messages");
const composer = document.getElementById("composer");
const promptEl = document.getElementById("prompt");
const sendButton = document.getElementById("send");
const statusEl = document.getElementById("status");
const historyEl = document.getElementById("history");
const historyListEl = document.getElementById("history-list");
const settingsToggle = document.getElementById("settings-toggle");

const conversation = [];
let showingHistory = false;

function addMessage(role, content) {
  messagesEl.querySelector(".empty-state")?.remove();
  const item = document.createElement("article");
  item.className = `message ${role}`;
  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = role === "user" ? "你" : "AI 助手";
  const body = document.createElement("p");
  body.textContent = content;
  item.append(label, body);
  messagesEl.appendChild(item);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setBusy(busy, text = "就绪") {
  sendButton.disabled = busy;
  promptEl.disabled = busy;
  statusEl.textContent = text;
}

function renderConversation() {
  messagesEl.innerHTML = "";
  if (!conversation.length) {
    messagesEl.innerHTML = `<div class="empty-state"><strong>从一个问题开始</strong><span>让 AI 帮你理解当前学习内容。</span></div>`;
    return;
  }
  conversation.forEach(({ role, content }) => addMessage(role, content));
}

async function saveConversation() {
  if (!conversation.length) return;
  const { edulensConversations = [] } = await chrome.storage.local.get({
    edulensConversations: [],
  });
  const firstQuestion =
    conversation.find((message) => message.role === "user")?.content ||
    "未命名对话";
  const record = {
    id: crypto.randomUUID(),
    title: firstQuestion.slice(0, 42),
    messages: [...conversation],
    updatedAt: new Date().toISOString(),
  };
  await chrome.storage.local.set({
    edulensConversations: [record, ...edulensConversations].slice(0, 50),
  });
  statusEl.textContent = "对话已保存";
}

function formatTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function renderHistory() {
  const { edulensConversations = [] } = await chrome.storage.local.get({
    edulensConversations: [],
  });
  historyListEl.innerHTML = "";
  if (!edulensConversations.length) {
    historyListEl.innerHTML = '<p class="history-empty">还没有保存的对话</p>';
    return;
  }
  edulensConversations.forEach((record) => {
    const button = document.createElement("button");
    button.className = "history-item";
    button.type = "button";
    button.innerHTML = `<strong></strong><span></span>`;
    button.querySelector("strong").textContent = record.title;
    button.querySelector("span").textContent =
      `${formatTime(record.updatedAt)} · ${record.messages.length} 条消息`;
    button.addEventListener("click", () => {
      conversation.splice(0, conversation.length, ...record.messages);
      renderConversation();
      toggleHistory(false);
      statusEl.textContent = "已载入历史对话";
    });
    historyListEl.appendChild(button);
  });
}

function toggleHistory(show) {
  showingHistory = show;
  historyEl.hidden = !show;
  messagesEl.hidden = show;
  composer.hidden = show;
  settingsToggle.title = show ? "返回对话" : "对话记录";
  settingsToggle.setAttribute("aria-label", settingsToggle.title);
  settingsToggle.textContent = show ? "‹" : "☰";
}

settingsToggle.addEventListener("click", async () => {
  if (showingHistory) {
    toggleHistory(false);
    return;
  }
  await saveConversation();
  await renderHistory();
  toggleHistory(true);
});

document.getElementById("new-conversation").addEventListener("click", () => {
  conversation.length = 0;
  renderConversation();
  toggleHistory(false);
  statusEl.textContent = "新对话";
});

document.getElementById("select-page").addEventListener("click", async () => {
  setBusy(true, "请在网页中拖动选择文字...");
  try {
    const response = await chrome.runtime.sendMessage({
      type: "START_PAGE_SELECTION",
    });
    if (response?.error) throw new Error(response.error);
  } catch (error) {
    setBusy(false, "选区失败");
    addMessage("error", error.message);
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "PAGE_SELECTION") return;
  setBusy(false, message.text ? "已引用网页选区" : "未选择文字");
  if (!message.text) return;
  promptEl.value = `${promptEl.value}${promptEl.value ? "\n\n" : ""}${message.text}`;
  promptEl.focus();
});

composer.addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = promptEl.value.trim();
  if (!prompt || sendButton.disabled) return;

  addMessage("user", prompt);
  conversation.push({ role: "user", content: prompt });
  promptEl.value = "";
  setBusy(true, "思考中...");

  try {
    const answer = await askAI(conversation);
    conversation.push({ role: "assistant", content: answer });
    addMessage("assistant", answer);
    setBusy(false);
  } catch (error) {
    addMessage("error", error.message);
    setBusy(false, "请求失败");
  }
});
