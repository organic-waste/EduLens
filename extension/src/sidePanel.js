import "../public/styles/sidePanel.css";

const SIDEPANEL_CHANNEL = "edulens_side_panel";
const t = (key, substitutions) => chrome.i18n.getMessage(key, substitutions);

function applyI18nTexts() {
  const uiLang = chrome.i18n.getUILanguage?.();
  if (uiLang) {
    document.documentElement.lang = uiLang;
  }
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const text = t(key);
    if (text) {
      el.textContent = text;
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const text = t(key);
    if (text) {
      el.setAttribute("placeholder", text);
    }
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    const text = t(key);
    if (text) {
      el.setAttribute("title", text);
      if (!el.getAttribute("aria-label")) {
        el.setAttribute("aria-label", text);
      }
    }
  });
}

let activeTabId = null;
let port = null;
let countdownTimer = null;
let countdownRemaining = 0;
let countdownResetTimeout = null;

// 统一收集面板里所有需要频繁访问的 DOM 节点，避免反复 query
const dom = {
  status: null,
  scrollFill: null,
  scrollPercent: null,
  bookmarkForm: null,
  bookmarkInput: null,
  bookmarkTrack: null,
  bookmarkEmpty: null,
  countdownInput: null,
  countdownStart: null,
  countdownCancel: null,
  countdownDisplay: null,
  countdownSetup: null,
  countdownActive: null,
  screenshotButtons: null,
  graffitiButtons: null,
  colorInput: null,
  penSlider: null,
  eraserSlider: null,
  graffitiClear: null,
  rectangleToggle: null,
  imageUpload: null,
  logout: null,
  authStatus: null,
  roomStatus: null,
  roomList: null,
  roomShare: null,
};

// 记录各功能块的运行时状态，方便 UI 渲染与控制同步
const state = {
  scrollPercent: 0,
  bookmarks: [],
  graffiti: null,
  auth: null,
  rooms: null,
};

// 页面加载完成后启动侧边栏逻辑
document.addEventListener("DOMContentLoaded", init);

async function init() {
  // 1. 缓存节点 -> 2. 获取当前激活标签 -> 3. 绑定事件与连接后台
  cacheDom();
  applyI18nTexts();
  await resolveActiveTab();
  if (!activeTabId) {
    setStatus(t("sidePanelNoActiveTab"), true);
    return;
  }
  setupEventHandlers();
  setupPort();
  await requestInitialState();
}

function cacheDom() {
  dom.status = document.getElementById("connection-status");
  dom.scrollFill = document.getElementById("scroll-progress");
  dom.scrollPercent = document.getElementById("scroll-percent");
  dom.bookmarkForm = document.getElementById("bookmark-form");
  dom.bookmarkInput = document.getElementById("bookmark-input");
  dom.bookmarkTrack = document.getElementById("bookmark-track");
  dom.bookmarkEmpty = document.getElementById("bookmark-empty");
  dom.countdownSetup = document.getElementById("countdown-setup");
  dom.countdownActive = document.getElementById("countdown-active");
  dom.countdownInput = document.getElementById("countdown-minutes");
  dom.countdownStart = document.getElementById("countdown-start");
  dom.countdownCancel = document.getElementById("countdown-cancel");
  dom.countdownDisplay = document.getElementById("countdown-display");
  dom.screenshotButtons = document.querySelectorAll("[data-screenshot]");
  dom.graffitiButtons = document.querySelectorAll("[data-mode]");
  dom.colorInput = document.getElementById("graffiti-color");
  dom.penSlider = document.getElementById("pen-size");
  dom.eraserSlider = document.getElementById("eraser-size");
  dom.graffitiClear = document.getElementById("graffiti-clear");
  dom.rectangleToggle = document.getElementById("rectangle-toggle");
  dom.imageUpload = document.getElementById("image-upload");
  dom.logout = document.getElementById("logout-btn");
  dom.authStatus = document.getElementById("auth-status");
  dom.roomStatus = document.getElementById("room-status");
  dom.roomList = document.getElementById("room-list");
  dom.roomShare = document.getElementById("room-share");
}

// 通过 Chrome API 获取当前标签页 ID，用于后续通信
async function resolveActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTabId = tab?.id ?? null;
}

// 与内容脚本建立长连接，接收实时状态推送
function setupPort() {
  try {
    port = chrome.tabs.connect(activeTabId, { name: SIDEPANEL_CHANNEL });
    port.onMessage.addListener(handlePortMessage);
    port.onDisconnect.addListener(() => {
      port = null;
      setStatus(t("sidePanelDisconnected"), true);
    });
    setStatus(t("sidePanelConnected"));
  } catch (error) {
    console.error(error);
    setStatus(t("sidePanelConnectFailed"), true);
  }
}

// 收到内容脚本广播的数据后按类型分别更新 UI
function handlePortMessage(message) {
  switch (message.type) {
    case "state":
      applyState(message.data);
      break;
    case "scroll":
      updateScroll(message.data);
      break;
    case "bookmarks":
      renderBookmarks(message.data);
      break;
    case "auth":
      updateAuth(message.data);
      break;
    default:
      break;
  }
}

function applyState(nextState) {
  if (!nextState) return;
  if (typeof nextState.scrollPercent === "number") {
    updateScroll(nextState.scrollPercent);
  }
  if (Array.isArray(nextState.bookmarks)) {
    renderBookmarks(nextState.bookmarks);
  }
  if (nextState.graffiti) {
    state.graffiti = nextState.graffiti;
    syncGraffitiControls();
  }
  if (nextState.auth) {
    updateAuth(nextState.auth);
  }
  if (nextState.rooms) {
    updateRoomState(nextState.rooms);
  }
}

function setupEventHandlers() {
  dom.bookmarkForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = dom.bookmarkInput.value.trim();
    if (!value) return;
    await sendAction("ADD_BOOKMARK", { text: value });
    dom.bookmarkInput.value = "";
  });

  dom.countdownStart?.addEventListener("click", startCountdown);
  dom.countdownCancel?.addEventListener("click", cancelCountdown);

  dom.bookmarkTrack?.addEventListener("click", async (e) => {
    const deleteBtn = e.target.closest(".bookmark-delete");
    if (deleteBtn) {
      e.stopPropagation();
      const dot = deleteBtn.closest(".bookmark-dot");
      if (!dot?.dataset.id) return;
      await sendAction("DELETE_BOOKMARK", { id: dot.dataset.id });
      return;
    }
    const dot = e.target.closest(".bookmark-dot");
    if (!dot?.dataset.id) return;
    await sendAction("JUMP_BOOKMARK", { id: dot.dataset.id });
  });

  dom.screenshotButtons?.forEach((btn) => {
    btn.addEventListener("click", async () => {
      await sendAction("SCREENSHOT", { type: btn.dataset.screenshot });
    });
  });

  dom.graffitiButtons?.forEach((btn) => {
    btn.addEventListener("click", async () => {
      await sendAction("GRAFFITI_MODE", { mode: btn.dataset.mode });
    });
  });

  dom.colorInput?.addEventListener("input", (e) => {
    sendAction("GRAFFITI_COLOR", { color: e.target.value });
  });
  dom.penSlider?.addEventListener("input", (e) => {
    sendAction("GRAFFITI_PEN_SIZE", { size: Number(e.target.value) });
  });
  dom.eraserSlider?.addEventListener("input", (e) => {
    sendAction("GRAFFITI_ERASER_SIZE", { size: Number(e.target.value) });
  });
  dom.graffitiClear?.addEventListener("click", () => {
    sendAction("GRAFFITI_CLEAR");
  });
  dom.rectangleToggle?.addEventListener("click", () => {
    sendAction("RECTANGLE_TOGGLE");
  });
  dom.imageUpload?.addEventListener("click", () => {
    sendAction("IMAGE_UPLOAD");
  });

  dom.logout?.addEventListener("click", () => sendAction("LOGOUT"));
  dom.roomList?.addEventListener("click", () => sendAction("ROOM_LIST"));
  dom.roomShare?.addEventListener("click", () => sendAction("ROOM_SHARE"));
}

// 主动向内容脚本拉取一份最新状态，保证初次打开即有数据
async function requestInitialState() {
  const data = await sendAction("GET_STATE");
  applyState(data);
}

// 所有按钮交互都会走 sendAction，将指令转发到内容脚本
async function sendAction(action, payload) {
  if (!activeTabId) throw new Error("No active tab");
  try {
    const response = await chrome.tabs.sendMessage(activeTabId, {
      channel: SIDEPANEL_CHANNEL,
      action,
      payload,
    });
    if (response?.error) throw new Error(response.error);
    return response?.data;
  } catch (error) {
    console.error("[EduLens] 操作执行失败", action, error);
    setStatus(t("sidePanelActionFailed"), true);
    return null;
  }
}

function updateScroll(percent) {
  state.scrollPercent = percent;
  dom.scrollFill.style.width = `${percent}%`;
  dom.scrollPercent.textContent = `${percent}%`;
}

function renderBookmarks(bookmarks = []) {
  state.bookmarks = bookmarks;
  if (!dom.bookmarkTrack) return;
  dom.bookmarkTrack.innerHTML = "";
  const hasBookmarks = Array.isArray(bookmarks) && bookmarks.length > 0;
  if (dom.bookmarkEmpty) {
    dom.bookmarkEmpty.style.display = hasBookmarks ? "none" : "block";
  }
  if (!hasBookmarks) return;

  bookmarks.forEach((bookmark) => {
    const percent = Math.max(
      0,
      Math.min(100, Number(bookmark.percent ?? bookmark.scrollPercent ?? 0))
    );
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "bookmark-dot";
    dot.dataset.id = bookmark.id;
    dot.style.left = `${percent}%`;
    dot.setAttribute("aria-label", bookmark.text);

    const tooltip = document.createElement("div");
    tooltip.className = "bookmark-tooltip";

    const title = document.createElement("span");
    title.className = "bookmark-title";
    title.textContent = bookmark.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "bookmark-delete";
    deleteBtn.textContent = "×";

    tooltip.append(title, deleteBtn);
    dot.appendChild(tooltip);
    let hideTooltipTimeout = null;
    const showTooltip = () => {
      clearTimeout(hideTooltipTimeout);
      tooltip.classList.add("visible");
    };
    // 鼠标移开时仍会显示一秒后才会消失，确保有时间点击到删除按钮
    const scheduleHideTooltip = () => {
      clearTimeout(hideTooltipTimeout);
      hideTooltipTimeout = setTimeout(() => {
        tooltip.classList.remove("visible");
      }, 1000);
    };
    dot.addEventListener("mouseenter", showTooltip);
    dot.addEventListener("focus", showTooltip);
    dot.addEventListener("mouseleave", scheduleHideTooltip);
    dot.addEventListener("blur", scheduleHideTooltip);
    tooltip.addEventListener("mouseenter", showTooltip);
    tooltip.addEventListener("mouseleave", scheduleHideTooltip);
    dom.bookmarkTrack.appendChild(dot);
  });
}

function toggleCountdownView(isRunning) {
  if (dom.countdownSetup) {
    dom.countdownSetup.hidden = isRunning;
    dom.countdownSetup.style.display = isRunning ? "none" : "flex";
  }
  if (dom.countdownActive) {
    dom.countdownActive.hidden = !isRunning;
    dom.countdownActive.style.display = isRunning ? "flex" : "none";
  }
  if (isRunning) {
    clearTimeout(countdownResetTimeout);
    countdownResetTimeout = null;
  }
}

function scheduleCountdownReset(delay = 0) {
  clearTimeout(countdownResetTimeout);
  countdownResetTimeout = setTimeout(() => {
    toggleCountdownView(false);
    if (dom.countdownDisplay) {
      dom.countdownDisplay.textContent = t("countdownIdle");
    }
  }, delay);
}

function startCountdown() {
  const minutes = Number(dom.countdownInput?.value);
  if (!minutes || minutes <= 0) return;
  countdownRemaining = Math.round(minutes * 60);
  if (dom.countdownInput) {
    dom.countdownInput.value = "";
  }
  toggleCountdownView(true);
  updateCountdownDisplay();
  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    countdownRemaining -= 1;
    if (countdownRemaining <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      countdownRemaining = 0;
      if (dom.countdownDisplay) {
        dom.countdownDisplay.textContent = t("countdownEnd");
      }
      scheduleCountdownReset(2000);
      return;
    }
    updateCountdownDisplay();
  }, 1000);
}

function cancelCountdown() {
  if (dom.countdownActive?.hidden) return;
  clearInterval(countdownTimer);
  countdownTimer = null;
  countdownRemaining = 0;
  if (dom.countdownDisplay) {
    dom.countdownDisplay.textContent = t("countdownCancel");
  }
  scheduleCountdownReset(1000);
}

function updateCountdownDisplay() {
  if (!dom.countdownDisplay) return;
  const minutes = Math.floor(countdownRemaining / 60);
  const seconds = countdownRemaining % 60;
  dom.countdownDisplay.textContent = `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function syncGraffitiControls() {
  if (!state.graffiti) return;
  const { mode, color, penBrushSize, eraserBrushSize } = state.graffiti;
  dom.colorInput.value = color;
  dom.penSlider.value = penBrushSize;
  dom.eraserSlider.value = eraserBrushSize;
  dom.graffitiButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
}

function updateAuth(status) {
  state.auth = status;
  if (status?.isAuthenticated && status.user) {
    dom.authStatus.textContent = t("authStatusLoggedIn", [
      status.user.username,
    ]);
    dom.logout.disabled = false;
  } else {
    dom.authStatus.textContent = t("authStatusLoggedOut");
    dom.logout.disabled = true;
  }
}

function updateRoomState(roomState) {
  state.rooms = roomState;
  if (roomState?.currentRoom) {
    dom.roomStatus.textContent = t("roomStatusSummary", [
      roomState.currentRoom.name,
      roomState.currentRoom.members,
    ]);
  } else {
    dom.roomStatus.textContent = t("noRoomSelected");
  }
}

function setStatus(message, isWarn = false) {
  if (!dom.status) return;
  dom.status.textContent = message;
  dom.status.style.color = isWarn ? "#dc2626" : "#475569";
}
