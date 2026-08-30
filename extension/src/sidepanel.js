import { askAI } from "./services/aiClient.js";
import { marked } from "marked";
import { authManager } from "./services/index.js";
import {
  loadRemoteSummaryDocuments,
  syncSummaryDocument,
} from "./services/summaryClient.js";
import { generateLearningSummary } from "./skills/summarySkill.js";
import "./sidepanel.css";

const authScreenEl = document.getElementById("auth-screen");
const assistantShellEl = document.getElementById("ai-shell");
const authForm = document.getElementById("auth-form");
const authTitleEl = document.getElementById("auth-title");
const authDescriptionEl = document.getElementById("auth-description");
const authUsernameFieldEl = document.getElementById("auth-username-field");
const authAccountFieldEl = document.getElementById("auth-account-field");
const authEmailFieldEl = document.getElementById("auth-email-field");
const authConfirmFieldEl = document.getElementById("auth-confirm-field");
const authUsernameEl = document.getElementById("auth-username");
const authAccountEl = document.getElementById("auth-account");
const authEmailEl = document.getElementById("auth-email");
const authPasswordEl = document.getElementById("auth-password");
const authConfirmPasswordEl = document.getElementById("auth-confirm-password");
const authErrorEl = document.getElementById("auth-error");
const authSubmitEl = document.getElementById("auth-submit");
const authToggleEl = document.getElementById("auth-toggle");
const messagesEl = document.getElementById("messages");
const composer = document.getElementById("composer");
const promptEl = document.getElementById("prompt");
const sendButton = document.getElementById("send");
const statusEl = document.getElementById("status");
const historyEl = document.getElementById("history");
const historyListEl = document.getElementById("history-list");
const settingsToggle = document.getElementById("settings-toggle");
const profileButton = document.getElementById("profile-button");
const summarizeButton = document.getElementById("summarize");
const summaryEl = document.getElementById("summary");
const summaryItemsEl = document.getElementById("summary-items");
const summaryContextEl = document.getElementById("summary-context");
const summaryContextTitleEl = document.getElementById("summary-context-title");
const clearSummaryContextButton = document.getElementById("clear-summary-context");
const summaryTitleEl = document.getElementById("summary-title");
const closeSummaryButton = document.getElementById("close-summary");
const libraryIcon = settingsToggle.querySelector(".library-icon");
const returnIcon = settingsToggle.querySelector(".return-icon");
returnIcon.setAttribute("viewBox", "0 0 24 24");
returnIcon.innerHTML = '<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />';

const CHAT_ICON = `<svg class="action-icon" viewBox="0 0 1024 1024" aria-hidden="true"><path d="M853.333333 138.666667H170.666667c-40.533333 0-74.666667 34.133333-74.666667 74.666666v512c0 40.533333 34.133333 74.666667 74.666667 74.666667h151.466666V917.333333c0 12.8 8.533333 25.6 19.2 29.866667 4.266667 2.133333 8.533333 2.133333 12.8 2.133333 8.533333 0 17.066667-4.266667 23.466667-10.666666l136.533333-138.666667H853.333333c40.533333 0 74.666667-34.133333 74.666667-74.666667V213.333333c0-40.533333-34.133333-74.666667-74.666667-74.666666z m10.666667 586.666666c0 6.4-4.266667 10.666667-10.666667 10.666667H501.333333c-8.533333 0-17.066667 4.266667-23.466666 10.666667l-89.6 93.866666V768c0-17.066667-14.933333-32-32-32H170.666667c-6.4 0-10.666667-4.266667-10.666667-10.666667V213.333333c0-6.4 4.266667-10.666667 10.666667-10.666666h682.666666c6.4 0 10.666667 4.266667 10.666667 10.666666v512z" /><path d="M512 490.666667H298.666667c-17.066667 0-32 14.933333-32 32S281.6 554.666667 298.666667 554.666667h213.333333c17.066667 0 32-14.933333 32-32S529.066667 490.666667 512 490.666667zM672 341.333333H298.666667c-17.066667 0-32 14.933333-32 32S281.6 405.333333 298.666667 405.333333h373.333333c17.066667 0 32-14.933333 32-32s-14.933333-32-32-32z" /></svg>`;

closeSummaryButton.innerHTML = CHAT_ICON;

const conversation = [];
let showingHistory = false;
let selectedPage = null;
let activeSummaryItem = null;
let activeSummaryDocument = null;
let currentSummaryDocument = null;
let authMode = "login";
let assistantInitialized = false;

function renderAuthMode() {
  const isRegister = authMode === "register";
  authTitleEl.textContent = isRegister ? "创建 EduLens 账号" : "登录学习助手";
  authDescriptionEl.textContent = isRegister
    ? "注册后即可保存学习画像、摘要和个性化学习记忆。"
    : "登录后即可使用 AI 对话、摘要库和个性化学习记忆。";
  authUsernameFieldEl.hidden = !isRegister;
  authAccountFieldEl.hidden = isRegister;
  authEmailFieldEl.hidden = !isRegister;
  authConfirmFieldEl.hidden = !isRegister;
  authUsernameEl.required = isRegister;
  authAccountEl.required = !isRegister;
  authEmailEl.required = isRegister;
  authConfirmPasswordEl.required = isRegister;
  authPasswordEl.autocomplete = isRegister ? "new-password" : "current-password";
  authSubmitEl.textContent = isRegister ? "注册并进入" : "登录";
  authToggleEl.textContent = isRegister ? "已有账号？去登录" : "还没有账号？去注册";
  authErrorEl.textContent = "";
}

function showAuthScreen() {
  assistantShellEl.hidden = true;
  authScreenEl.hidden = false;
  renderAuthMode();
}

async function showAssistant() {
  authScreenEl.hidden = true;
  assistantShellEl.hidden = false;
  if (assistantInitialized) return;
  assistantInitialized = true;
  await restoreSummary();
  await restoreConversation();
  await restoreRemoteSummaries();
}

function renderSummaryContext() {
  const hasContext = activeSummaryDocument?.groups.some((group) => group.items.length);
  summaryContextEl.hidden = !hasContext;
  summaryContextTitleEl.textContent = hasContext ? activeSummaryDocument.title : "";
}

function normalizeSummaryDocument(summary) {
  if (!summary) return null;
  const source = summary.source || {};
  const sourceUrl =
    source.pageUrl ||
    summary.sourceUrl ||
    summary.groups
      ?.flatMap((group) => group.items || [])
      .find((item) => item.citation?.pageUrl)?.citation?.pageUrl;
  const groups = summary.groups?.length
    ? summary.groups
    : [{ topic: "知识点", items: summary.items || [] }];
  return {
    ...summary,
    source: {
      ...source,
      pageUrl: sourceUrl,
    },
    sourceUrl,
    title: summary.title || "网页摘要",
    groups: groups.map((group) => ({
      ...group,
      topic: group.topic || "知识点",
      items: (group.items || []).map((item) => ({
        ...item,
        citation: {
          ...source.citation,
          ...item.citation,
          pageUrl: item.citation?.pageUrl || sourceUrl,
          quote: item.citation?.quote || item.quote || source.citation?.quote,
        },
      })),
    })),
  };
}

function sourceKey(summary) {
  return summary.sourceUrl?.split("#")[0].replace(/\/$/, "");
}

function mergeSummaryDocuments(existing, incoming) {
  const groupsByTopic = new Map(
    existing.groups.map((group) => [
      group.topic.trim().toLocaleLowerCase(),
      { ...group, items: [...group.items] },
    ]),
  );

  incoming.groups.forEach((group) => {
    const key = group.topic.trim().toLocaleLowerCase();
    const current = groupsByTopic.get(key);
    if (!current) {
      groupsByTopic.set(key, { ...group, items: [...group.items] });
      return;
    }

    const existingQuotes = new Set(
      current.items.map((item) => item.citation?.quote || item.quote || item.content),
    );
    group.items.forEach((item) => {
      const quote = item.citation?.quote || item.quote || item.content;
      if (!existingQuotes.has(quote)) {
        current.items.push(item);
        existingQuotes.add(quote);
      }
    });
  });

  return normalizeSummaryDocument({
    ...existing,
    groups: [...groupsByTopic.values()],
    updatedAt: incoming.updatedAt || new Date().toISOString(),
  });
}

function mergeSummariesBySource(documents) {
  const summariesBySource = new Map();
  documents.forEach((summary) => {
    const key = sourceKey(summary) || summary.id || summary._id;
    const existing = summariesBySource.get(key);
    summariesBySource.set(key, existing ? mergeSummaryDocuments(existing, summary) : summary);
  });
  return [...summariesBySource.values()];
}

function summaryPrompt(summary) {
  const topics = summary.groups
    .map(
      (group) =>
        `${group.topic}:\n${group.items.map((item) => `- ${item.content}`).join("\n")}`,
    )
    .join("\n");
  return [
    "Answer the user based on this summary and its cited source.",
    `Summary title: ${summary.title}`,
    topics,
    `Source: ${summary.source?.pageUrl || "current webpage"}`,
  ].join("\n");
}

function clearSummaryContext() {
  activeSummaryItem = null;
  activeSummaryDocument = null;
  renderSummaryContext();
}

function getCitation(summary, item) {
  const source = summary.source || {};
  return {
    ...source,
    ...source.citation,
    ...item.citation,
    pageUrl: item.citation?.pageUrl || source.pageUrl || summary.sourceUrl,
    quote: item.citation?.quote || item.quote || source.citation?.quote || source.quote,
    selector: item.citation?.selector || source.citation?.selector,
  };
}

function attachSourceToSummaryItems(summary, source) {
  return {
    ...summary,
    groups: summary.groups.map((group) => ({
      ...group,
      items: group.items.map((item) => ({
        ...item,
        citation: {
          ...source.citation,
          ...item.citation,
          pageUrl: source.pageUrl,
          quote: item.citation?.quote || item.quote || source.citation?.quote,
        },
      })),
    })),
  };
}

function showCitationResult(result) {
  if (result?.error) {
    statusEl.textContent = result.error;
    return;
  }
  statusEl.textContent = result?.located ? "已定位网页引用" : "未找到对应网页引用";
}

function addMessage(role, content, onSupplement) {
  messagesEl.querySelector(".empty-state")?.remove();
  const item = document.createElement("article");
  item.className = `message ${role}`;
  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = role === "user" ? "你" : "AI 助手";
  const body = document.createElement(role === "assistant" ? "div" : "p");
  if (role === "assistant") {
    body.className = "markdown-body";
    body.innerHTML = marked.parse(content, { async: false, gfm: true, breaks: true });
  } else {
    body.textContent = content;
  }
  item.append(label, body);
  if (onSupplement) {
    const supplement = document.createElement("button");
    supplement.className = "supplement-button";
    supplement.type = "button";
    supplement.textContent = "补充到当前摘要";
    supplement.addEventListener("click", onSupplement);
    item.appendChild(supplement);
  }
  messagesEl.appendChild(item);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setBusy(busy, text = "就绪") {
  sendButton.disabled = busy;
  promptEl.disabled = busy;
  statusEl.textContent = text;
  statusEl.classList.toggle("loading", busy);
}

function showSummary(show) {
  if (show) {
    showingHistory = false;
    historyEl.hidden = true;
  }
  summaryEl.hidden = !show;
  messagesEl.hidden = show;
  composer.hidden = show;
  if (show) setSettingsToggleIcon(false);
  renderSummaryContext();
}

function renderSummary(summary) {
  summary = normalizeSummaryDocument(summary);
  currentSummaryDocument = summary;
  summaryTitleEl.textContent = summary.title;
  summaryItemsEl.innerHTML = "";
  summary.groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "summary-group";
    const heading = document.createElement("h3");
    heading.textContent = group.topic;
    section.appendChild(heading);
    group.items.forEach((item, index) => {
      const row = document.createElement("article");
      row.className = "summary-item";
      const text = document.createElement("button");
      text.className = "summary-content";
      text.type = "button";
      text.textContent = `${index + 1}. ${item.content}`;
      text.title = "回到网页引用位置";
      text.addEventListener("click", async () => {
        activeSummaryItem = item;
        activeSummaryDocument = summary;
        renderSummaryContext();
        const citation = getCitation(summary, item);
        if (!citation.pageUrl) {
          statusEl.textContent = "该旧摘要未保存来源页面，请重新生成摘要";
          return;
        }
        const result = await chrome.runtime.sendMessage({
          type: "JUMP_TO_CITATION",
          citation,
        });
        showCitationResult(result);
      });
      row.append(text);
      section.appendChild(row);
    });
    summaryItemsEl.appendChild(section);
  });
  showSummary(true);
}

function renderConversation() {
  messagesEl.innerHTML = "";
  if (!conversation.length) {
    messagesEl.innerHTML = `<div class="empty-state"><strong>从一个问题开始</strong><span>让 AI 帮你理解当前学习内容。</span></div>`;
    return;
  }
  conversation.forEach(({ role, content }) => addMessage(role, content));
}

async function persistConversation() {
  await chrome.storage.local.set({ edulensActiveConversation: [...conversation] });
}

async function restoreConversation() {
  const { edulensActiveConversation = [] } = await chrome.storage.local.get({
    edulensActiveConversation: [],
  });
  if (edulensActiveConversation.length) {
    conversation.splice(0, conversation.length, ...edulensActiveConversation);
    renderConversation();
  }
}

function formatTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function saveSummaryDocument(summary) {
  const { edulensSummaryDocuments = [] } = await chrome.storage.local.get({
    edulensSummaryDocuments: [],
  });
  const existing = edulensSummaryDocuments
    .map(normalizeSummaryDocument)
    .find((document) => sourceKey(document) === sourceKey(summary));
  const document = existing ? mergeSummaryDocuments(existing, summary) : summary;
  const documents = [
    document,
    ...edulensSummaryDocuments.filter(
      (item) => sourceKey(item) !== sourceKey(document),
    ),
  ].slice(0, 50);
  await chrome.storage.local.set({
    edulensSummaryDocuments: documents,
    edulensCurrentSummary: document,
  });

  try {
    const remote = await syncSummaryDocument(document);
    if (!remote?._id) return document;

    const syncedSummary = { ...document, remoteId: remote._id };
    await chrome.storage.local.set({
      edulensSummaryDocuments: [syncedSummary, ...documents.slice(1)],
      edulensCurrentSummary: syncedSummary,
    });
    return syncedSummary;
  } catch (error) {
    console.warn("摘要远程同步失败，已保留本地摘要", error);
    return summary;
  }
}

async function renderHistory() {
  const { edulensSummaryDocuments = [] } = await chrome.storage.local.get({
    edulensSummaryDocuments: [],
  });
  const documents = edulensSummaryDocuments
    .map(normalizeSummaryDocument)
    .filter(Boolean);
  historyListEl.innerHTML = "";
  if (!documents.length) {
    historyListEl.innerHTML = '<p class="history-empty">还没有保存的摘要</p>';
    return;
  }
  documents.forEach((record) => {
    const item = document.createElement("article");
    item.className = "history-item";
    item.innerHTML = `<button class="history-main" type="button"><strong></strong><span></span></button><button class="history-chat" type="button" title="围绕摘要提问" aria-label="围绕摘要提问">${CHAT_ICON}</button>`;
    const mainButton = item.querySelector(".history-main");
    const chatButton = item.querySelector(".history-chat");
    item.querySelector(".history-main strong").textContent = record.title;
    const itemCount = record.groups.reduce((count, group) => count + group.items.length, 0);
    item.querySelector(".history-main span").textContent =
      `${formatTime(record.updatedAt || record.createdAt)} · ${itemCount} 个知识点`;
    mainButton.addEventListener("click", () => {
      renderSummary(record);
      statusEl.textContent = "已打开摘要";
    });
    chatButton.addEventListener("click", (event) => {
      event.stopPropagation();
      activeSummaryDocument = record;
      activeSummaryItem = null;
      toggleHistory(false);
      renderSummaryContext();
      promptEl.focus();
    });
    historyListEl.appendChild(item);
  });
}

async function restoreSummary() {
  const { edulensCurrentSummary } = await chrome.storage.local.get({ edulensCurrentSummary: null });
  const summary = normalizeSummaryDocument(edulensCurrentSummary);
  if (summary?.groups?.length) {
    renderSummary(summary);
    showSummary(false);
  }
}

function toggleHistory(show) {
  showingHistory = show;
  historyEl.hidden = !show;
  messagesEl.hidden = show;
  composer.hidden = show;
  if (show) summaryEl.hidden = true;
  setSettingsToggleIcon(show);
}

function setSettingsToggleIcon(showingLibrary) {
  settingsToggle.title = showingLibrary ? "返回对话" : "摘要库";
  settingsToggle.setAttribute("aria-label", settingsToggle.title);
  if (showingLibrary) {
    libraryIcon.setAttribute("hidden", "");
    libraryIcon.style.display = "none";
    returnIcon.removeAttribute("hidden");
    returnIcon.style.display = "block";
    return;
  }
  libraryIcon.removeAttribute("hidden");
  libraryIcon.style.display = "block";
  returnIcon.setAttribute("hidden", "");
  returnIcon.style.display = "none";
}

setSettingsToggleIcon(false);

const authInputs = [
  authUsernameEl,
  authAccountEl,
  authEmailEl,
  authPasswordEl,
  authConfirmPasswordEl,
];

function showAuthFieldError(input, message) {
  input.setAttribute("aria-invalid", "true");
  authErrorEl.textContent = message;
  input.focus();
  return false;
}

function validateAuthForm() {
  const isRegister = authMode === "register";
  const username = authUsernameEl.value.trim();
  const account = authAccountEl.value.trim();
  const email = authEmailEl.value.trim();
  const password = authPasswordEl.value;
  const confirmPassword = authConfirmPasswordEl.value;

  authInputs.forEach((input) => input.removeAttribute("aria-invalid"));
  authErrorEl.textContent = "";

  if (!isRegister && !account) return showAuthFieldError(authAccountEl, "请填写用户名或邮箱。");
  if (isRegister && !username) return showAuthFieldError(authUsernameEl, "请填写用户名。");
  if (isRegister && username.length < 3) return showAuthFieldError(authUsernameEl, "用户名至少需要 3 个字符。");
  if (isRegister && !email) return showAuthFieldError(authEmailEl, "请填写邮箱。");
  if (isRegister && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAuthFieldError(authEmailEl, "请输入有效的邮箱地址。");
  if (!password) return showAuthFieldError(authPasswordEl, "请填写密码。");
  if (password.length < 6) return showAuthFieldError(authPasswordEl, "密码至少需要 6 个字符。");
  if (isRegister && !confirmPassword) return showAuthFieldError(authConfirmPasswordEl, "请确认密码。");
  if (isRegister && password !== confirmPassword) return showAuthFieldError(authConfirmPasswordEl, "两次输入的密码不一致。");

  return true;
}

authInputs.forEach((input) => {
  input.addEventListener("input", () => input.removeAttribute("aria-invalid"));
});

authToggleEl.addEventListener("click", () => {
  authMode = authMode === "login" ? "register" : "login";
  renderAuthMode();
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateAuthForm()) return;
  const password = authPasswordEl.value;
  const isRegister = authMode === "register";
  const username = authUsernameEl.value.trim();
  const email = authEmailEl.value.trim();
  const account = authAccountEl.value.trim();
  authSubmitEl.disabled = true;
  authErrorEl.textContent = "";
  try {
    const result = isRegister
      ? await authManager.register({ username, email, password })
      : await authManager.login({ account, password });
    if (result.status !== "success") throw new Error(result.message || "认证失败");
    await showAssistant();
  } catch (error) {
    authErrorEl.textContent = error.message;
  } finally {
    authSubmitEl.disabled = false;
  }
});

profileButton.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("src/profile.html") });
});

settingsToggle.addEventListener("click", async () => {
  if (showingHistory) {
    toggleHistory(false);
    return;
  }
  await renderHistory();
  toggleHistory(true);
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
  selectedPage = message;
  summarizeButton.disabled = false;
  promptEl.value = `${promptEl.value}${promptEl.value ? "\n\n" : ""}${message.text}`;
  promptEl.focus();
});

summarizeButton.addEventListener("click", async () => {
  if (!selectedPage?.text) return;
  setBusy(true, "正在整理摘要...");
  summarizeButton.disabled = true;
  try {
    const summary = attachSourceToSummaryItems(
      await generateLearningSummary(selectedPage),
      selectedPage,
    );
    const summaryDocument = {
      id: crypto.randomUUID(),
      ...summary,
      source: selectedPage,
      sourceUrl: selectedPage.pageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const savedDocument = await saveSummaryDocument(summaryDocument);
    renderSummary(savedDocument);
    statusEl.textContent = "摘要已保存";
  } catch (error) {
    addMessage("error", error.message);
    statusEl.textContent = "摘要失败";
  } finally {
    setBusy(false);
    summarizeButton.disabled = !selectedPage?.text;
  }
});

closeSummaryButton.addEventListener("click", () => showSummary(false));
clearSummaryContextButton.addEventListener("click", () => {
  clearSummaryContext();
});

async function supplementSummary(answer) {
  if (!activeSummaryDocument || !activeSummaryItem) return;
  const item = {
    id: crypto.randomUUID(),
    content: answer,
    quote: activeSummaryItem.quote,
    level: Math.min((activeSummaryItem.level || 1) + 1, 3),
    generated: true,
  };
  activeSummaryDocument.updatedAt = new Date().toISOString();
  activeSummaryDocument = normalizeSummaryDocument(activeSummaryDocument);
  const targetGroup = activeSummaryDocument.groups.find((group) =>
    group.items.includes(activeSummaryItem),
  ) || activeSummaryDocument.groups[0];
  targetGroup.items.push(item);
  const { edulensSummaryDocuments = [] } = await chrome.storage.local.get({ edulensSummaryDocuments: [] });
  await chrome.storage.local.set({
    edulensSummaryDocuments: edulensSummaryDocuments.map((document) =>
      document.id === activeSummaryDocument.id ? activeSummaryDocument : document
    ),
  });
  await chrome.storage.local.set({ edulensCurrentSummary: activeSummaryDocument });
  try {
    await syncSummaryDocument(activeSummaryDocument);
  } catch (error) {
    console.warn("摘要更新远程同步失败", error);
  }
  statusEl.textContent = "已补充到摘要";
}

composer.addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = promptEl.value.trim();
  if (!prompt || sendButton.disabled) return;

  addMessage("user", prompt);
  conversation.push({ role: "user", content: prompt });
  await persistConversation();
  promptEl.value = "";
  setBusy(true, "思考中...");

  try {
    const context = activeSummaryDocument
      ? [{ role: "system", content: summaryPrompt(activeSummaryDocument) }]
      : [];
    const answer = await askAI([...context, ...conversation]);
    conversation.push({ role: "assistant", content: answer });
    await persistConversation();
    addMessage(
      "assistant",
      answer,
      activeSummaryItem ? () => supplementSummary(answer) : undefined,
    );
    setBusy(false);
  } catch (error) {
    addMessage("error", error.message);
    setBusy(false, "请求失败");
  }
});

async function restoreRemoteSummaries() {
  try {
    const remote = await loadRemoteSummaryDocuments();
    if (!remote.length) return;

    const remoteDocuments = remote.map((item) =>
      normalizeSummaryDocument({ ...item, id: item._id, remoteId: item._id }),
    );
    const { edulensSummaryDocuments = [] } = await chrome.storage.local.get({
      edulensSummaryDocuments: [],
    });
    const documentsById = new Map(
      edulensSummaryDocuments.map((item) => [item.remoteId || item.id, item]),
    );
    remoteDocuments.forEach((item) =>
      documentsById.set(item.remoteId || item.id, item),
    );
    const merged = mergeSummariesBySource([...documentsById.values()])
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0) -
          new Date(a.updatedAt || a.createdAt || 0),
      )
      .slice(0, 50);
    await chrome.storage.local.set({ edulensSummaryDocuments: merged });
    if (!currentSummaryDocument) {
      await chrome.storage.local.set({ edulensCurrentSummary: merged[0] });
    }
    if (showingHistory) await renderHistory();
  } catch (error) {
    console.warn("远程摘要加载失败，继续使用本地摘要", error);
  }
}

async function initializeSidepanel() {
  const authenticated = await authManager.init();
  if (!authenticated) {
    showAuthScreen();
    return;
  }
  await showAssistant();
}

initializeSidepanel();
