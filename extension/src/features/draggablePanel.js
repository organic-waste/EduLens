/* Popup 桥接层 */
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
import {
  activateScreenshot,
  triggerScreenshot,
} from "./tools/screenshot.js";
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

const POPUP_CHANNEL = "edulens_popup";
const popupPorts = new Set();

function broadcast(message) {
  popupPorts.forEach((port) => {
    try {
      port.postMessage(message);
    } catch (error) {
      console.warn("[EduLens] 无法发送 popup 消息", error);
    }
  });
}

function collectPanelState() {
  return {
    scrollPercent: getScrollPercent(),
    bookmarks: listBookmarks(),
    graffiti: getGraffitiState(),
    auth: getLoginStatus(),
    rooms: getRoomState(),
  };
}

function setupConnections() {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== POPUP_CHANNEL) return;
    popupPorts.add(port);
    port.onDisconnect.addListener(() => popupPorts.delete(port));
    port.postMessage({ type: "state", data: collectPanelState() });
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.channel !== POPUP_CHANNEL) return;
    const { action, payload } = message;
    handlePopupAction(action, payload)
      .then((data) => sendResponse({ data }))
      .catch((error) => {
        console.error("[EduLens] popup action error", error);
        sendResponse({ error: error.message || "Unexpected error" });
      });
    return true;
  });
}

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

export function initializePanelBridge() {
  activateScrollProgress();
  subscribeScrollProgress((percent) =>
    broadcast({ type: "scroll", data: percent })
  );

  activateBookmark();
  subscribeBookmarks((items) =>
    broadcast({ type: "bookmarks", data: items })
  );

  activateGraffiti();
  activateScreenshot();
  activateLogin({ autoPrompt: false });
  subscribeLoginStatus((status) =>
    broadcast({ type: "auth", data: status })
  );

  activateRoomSelector();

  setupConnections();
}
