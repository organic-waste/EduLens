/* 侧边栏桥接层：在内容脚本内部对接所有功能模块，并把状态同步到 sidePanel */
import {
  activateScrollProgress,
  subscribeScrollProgress,
  getScrollPercent,
} from "./tools/scrollProgress.js";
import {
  activateBookmark,
  listBookmarks,
  addBookmark,
  deleteBookmark,
  scrollToBookmark,
  subscribeBookmarks,
} from "./tools/bookmark.js";
import {
  activateGraffiti,
  setGraffitiMode,
  setGraffitiColor,
  setPenBrushSize,
  setEraserBrushSize,
  clearGraffitiCanvas,
  getGraffitiState,
} from "./tools/graffiti.js";
import { activateScreenshot, triggerScreenshot } from "./tools/screenshot.js";
import {
  activateLogin,
  openLoginPanel,
  subscribeLoginStatus,
  getLoginStatus,
  logout as logoutUser,
} from "./accounts/login.js";
import {
  activateRoomSelector,
  openRoomListOverlay,
  openShareRoomDialog,
  getRoomState,
} from "./accounts/room.js";
import { toggleRectangleMode } from "./tools/rectangleAnnotation.js";
import { triggerImageUpload } from "./tools/uploadImage.js";

const SIDEPANEL_CHANNEL = "edulens_side_panel";
const sidePanelPorts = new Set(); // 用于同时支持多个侧边栏实例（多窗口）连接，记录端口信息

// 将最新状态广播给所有已连接的侧边栏
function broadcast(message) {
  sidePanelPorts.forEach((port) => {
    try {
      port.postMessage(message);
    } catch (error) {
      console.warn("[EduLens] 无法发送弹窗消息", error);
    }
  });
}

// 汇总当前页面的各类状态，供侧边栏初始渲染
function collectPanelState() {
  return {
    scrollPercent: getScrollPercent(),
    bookmarks: listBookmarks(),
    graffiti: getGraffitiState(),
    auth: getLoginStatus(),
    rooms: getRoomState(),
  };
}

// 建立与侧边栏的长连接消息通道
function setupConnections() {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== SIDEPANEL_CHANNEL) return;
    sidePanelPorts.add(port);
    port.onDisconnect.addListener(() => sidePanelPorts.delete(port));
    port.postMessage({ type: "state", data: collectPanelState() });
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.channel !== SIDEPANEL_CHANNEL) return;
    const { action, payload } = message;
    handlePopupAction(action, payload)
      .then((data) => sendResponse({ data }))
      .catch((error) => {
        console.error("[EduLens] 弹窗指令执行失败", error);
        sendResponse({ error: error.message || "未知错误" });
      });
    return true;
  });
}

// 处理侧边栏发来的动作请求，直接复用现有工具方法
async function handlePopupAction(action, payload = {}) {
  switch (action) {
    case "GET_STATE":
      return collectPanelState();
    case "ADD_BOOKMARK":
      await addBookmark(payload.text || "");
      return listBookmarks();
    case "DELETE_BOOKMARK":
      await deleteBookmark(payload.id);
      return listBookmarks();
    case "JUMP_BOOKMARK":
      scrollToBookmark(payload.id);
      return true;
    case "SCREENSHOT":
      await triggerScreenshot(payload.type);
      return true;
    case "GRAFFITI_MODE":
      setGraffitiMode(payload.mode);
      return getGraffitiState();
    case "GRAFFITI_COLOR":
      setGraffitiColor(payload.color);
      return getGraffitiState();
    case "GRAFFITI_PEN_SIZE":
      setPenBrushSize(payload.size);
      return getGraffitiState();
    case "GRAFFITI_ERASER_SIZE":
      setEraserBrushSize(payload.size);
      return getGraffitiState();
    case "GRAFFITI_CLEAR":
      clearGraffitiCanvas();
      return true;
    case "RECTANGLE_TOGGLE":
      toggleRectangleMode();
      return true;
    case "IMAGE_UPLOAD":
      triggerImageUpload();
      return true;
    case "LOGIN_OPEN":
      openLoginPanel();
      return true;
    case "LOGOUT":
      await logoutUser();
      openLoginPanel();
      return getLoginStatus();
    case "ROOM_LIST":
      await openRoomListOverlay();
      return true;
    case "ROOM_SHARE":
      await openShareRoomDialog();
      return true;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

// 内容脚本入口调用此方法，将功能模块与侧边栏打通
export function initializePanelBridge() {
  activateScrollProgress();
  subscribeScrollProgress((percent) =>
    broadcast({ type: "scroll", data: percent })
  );

  activateBookmark();
  subscribeBookmarks((items) => broadcast({ type: "bookmarks", data: items }));

  activateGraffiti();
  activateScreenshot();
  activateLogin({ autoPrompt: false });
  subscribeLoginStatus((status) => broadcast({ type: "auth", data: status }));

  activateRoomSelector();

  setupConnections();
}
