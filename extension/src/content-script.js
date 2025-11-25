import { injectStyles, injectIcon } from "./utils/index.js";
import filterStore from "./stores/filterStore.js";
import { activateDraggablePanel } from "./features/draggablePanel.js";
import eventStore from "./stores/eventStore.js";
import { apiClient } from "./services/index.js";

const PANEL_VISIBILITY_KEY = "edulensPanelVisible";
let cachedPanelVisible = true;

function setPanelVisibility(visible) {
  cachedPanelVisible = visible;
  const host = window.__EDULENS_HOST__;
  if (host) {
    host.style.display = visible ? "contents" : "none";
    host.dataset.visible = visible ? "true" : "false";
  }
}

async function initializePanelVisibility() {
  try {
    const result = await chrome.storage.local.get({
      [PANEL_VISIBILITY_KEY]: true,
    });
    setPanelVisibility(Boolean(result[PANEL_VISIBILITY_KEY]));
  } catch (error) {
    console.warn("Failed to load EduLens panel visibility:", error);
    setPanelVisibility(true);
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "SET_PANEL_VISIBILITY") {
    const isVisible = Boolean(message.visible);
    setPanelVisibility(isVisible);
    chrome.storage.local.set({ [PANEL_VISIBILITY_KEY]: isVisible });
  }
});

//统一的键盘管理
function keydown(e, key, name) {
  if (e.altKey && e.key === key) {
    if (filterStore.active === name) {
      filterStore.setActive(null);
    } else {
      filterStore.setActive(name);
    }
  }
}

eventStore.on(window, "keydown", (e) => {
  keydown(e, "h", "mouseHighlight");
  keydown(e, "s", "spotlight");
  keydown(e, "r", "readingSpotlight");
});

(async function activatePlugin() {
  await injectStyles();
  await initializePanelVisibility();
  // injectIcon();
  activateDraggablePanel();
  // 确保宿主节点的显隐状态与缓存保持一致
  setPanelVisibility(cachedPanelVisible);

  //测试是否能连接到后端云服务
  const connected = await apiClient.testConnection();
  if (connected) {
    // console.log("[EduLens] 云服务已连接");
  } else {
    // console.log("[EduLens] 使用本地模式");
  }
})();
