import "./popup.css";

const CHANNEL = "edulens_popup";

let activeTabId = null;
let port = null;
let countdownTimer = null;
let countdownRemaining = 0;

const dom = {
  status: null,
  scrollFill: null,
  scrollPercent: null,
  bookmarkForm: null,
  bookmarkInput: null,
  bookmarkList: null,
  countdownInput: null,
  countdownStart: null,
  countdownCancel: null,
  countdownDisplay: null,
  screenshotButtons: null,
  graffitiButtons: null,
  colorInput: null,
  penSlider: null,
  eraserSlider: null,
  graffitiClear: null,
  rectangleToggle: null,
  imageUpload: null,
  loginOpen: null,
  logout: null,
  authStatus: null,
  roomStatus: null,
  roomList: null,
  roomShare: null,
};

const state = {
  scrollPercent: 0,
  bookmarks: [],
  graffiti: null,
  auth: null,
  rooms: null,
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheDom();
  await resolveActiveTab();
  if (!activeTabId) {
    setStatus("未找到可用标签页", true);
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
  dom.bookmarkList = document.getElementById("bookmark-list");
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
  dom.loginOpen = document.getElementById("login-open");
  dom.logout = document.getElementById("logout-btn");
  dom.authStatus = document.getElementById("auth-status");
  dom.roomStatus = document.getElementById("room-status");
  dom.roomList = document.getElementById("room-list");
  dom.roomShare = document.getElementById("room-share");
}

async function resolveActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTabId = tab?.id ?? null;
}

function setupPort() {
  try {
    port = chrome.tabs.connect(activeTabId, { name: CHANNEL });
    port.onMessage.addListener(handlePortMessage);
    port.onDisconnect.addListener(() => {
      port = null;
      setStatus("未连接", true);
    });
    setStatus("已连接");
  } catch (error) {
    console.error(error);
    setStatus("无法连接内容页", true);
  }
}

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

  dom.bookmarkList?.addEventListener("click", async (e) => {
    const id = e.target.closest("[data-id]")?.dataset.id;
    if (!id) return;
    if (e.target.matches(".delete")) {
      await sendAction("DELETE_BOOKMARK", { id });
    } else {
      await sendAction("JUMP_BOOKMARK", { id });
    }
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

  dom.loginOpen?.addEventListener("click", () => sendAction("LOGIN_OPEN"));
  dom.logout?.addEventListener("click", () => sendAction("LOGOUT"));
  dom.roomList?.addEventListener("click", () => sendAction("ROOM_LIST"));
  dom.roomShare?.addEventListener("click", () => sendAction("ROOM_SHARE"));
}

async function requestInitialState() {
  const data = await sendAction("GET_STATE");
  applyState(data);
}

async function sendAction(action, payload) {
  if (!activeTabId) throw new Error("No active tab");
  try {
    const response = await chrome.tabs.sendMessage(activeTabId, {
      channel: CHANNEL,
      action,
      payload,
    });
    if (response?.error) throw new Error(response.error);
    return response?.data;
  } catch (error) {
    console.error("[EduLens] action failed", action, error);
    setStatus("操作失败", true);
    return null;
  }
}

function updateScroll(percent) {
  state.scrollPercent = percent;
  dom.scrollFill.style.width = `${percent}%`;
  dom.scrollPercent.textContent = `${percent}%`;
}

function renderBookmarks(bookmarks) {
  state.bookmarks = bookmarks;
  dom.bookmarkList.innerHTML = "";
  if (!bookmarks.length) {
    const empty = document.createElement("li");
    empty.textContent = "暂无书签";
    empty.className = "bookmark-item empty";
    dom.bookmarkList.appendChild(empty);
    return;
  }
  bookmarks.forEach((bookmark) => {
    const li = document.createElement("li");
    li.className = "bookmark-item";
    li.dataset.id = bookmark.id;
    const span = document.createElement("span");
    span.className = "title";
    span.textContent = bookmark.text;
    const btn = document.createElement("button");
    btn.className = "delete";
    btn.textContent = "×";
    li.append(span, btn);
    dom.bookmarkList.appendChild(li);
  });
}

function startCountdown() {
  const minutes = Number(dom.countdownInput.value);
  if (!minutes || minutes <= 0) return;
  countdownRemaining = Math.round(minutes * 60);
  dom.countdownInput.value = "";
  updateCountdownDisplay();
  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    countdownRemaining -= 1;
    if (countdownRemaining <= 0) {
      dom.countdownDisplay.textContent = "时间到！";
      clearInterval(countdownTimer);
      countdownTimer = null;
      return;
    }
    updateCountdownDisplay();
  }, 1000);
}

function cancelCountdown() {
  clearInterval(countdownTimer);
  countdownTimer = null;
  countdownRemaining = 0;
  dom.countdownDisplay.textContent = "已取消";
}

function updateCountdownDisplay() {
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
    dom.authStatus.textContent = `已登录：${status.user.username}`;
    dom.logout.disabled = false;
  } else {
    dom.authStatus.textContent = "未登录";
    dom.logout.disabled = true;
  }
}

function updateRoomState(roomState) {
  state.rooms = roomState;
  if (roomState?.currentRoom) {
    dom.roomStatus.textContent = `房间：${roomState.currentRoom.name}（${roomState.currentRoom.members}人）`;
  } else {
    dom.roomStatus.textContent = "未加入房间";
  }
}

function setStatus(message, isWarn = false) {
  if (!dom.status) return;
  dom.status.textContent = message;
  dom.status.style.color = isWarn ? "#dc2626" : "#475569";
}
