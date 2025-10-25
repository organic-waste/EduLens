/*数据云端同步和本地存储 */
import { apiClient } from "./apiClient.js";
import { authManager } from "./authManager.js";
import { webSocketClient } from "./webSocketClient.js";
import { roomManager } from "./roomManager.js";
import { getPageKey } from "../utils/index.js";
import {
  getPageData,
  getPageDataByType,
  savePageData,
  saveMultiplePageData,
} from "./storageManager.js";

class SyncManager {
  constructor() {
    this.currentVersion = 0;
    this.pendingOperations = [];
    this.isSyncing = false;
    this.lastSyncTime = 0;
    this.syncInterval = 30000; // 30秒同步间隔

    // 注册WebSocket事件处理器
    this.setupWebSocketHandlers();
    // 启动定期同步
    this.startPeriodicSync();
  }

  setupWebSocketHandlers() {
    webSocketClient.on("operation", this.handleRemoteOperation.bind(this));
    webSocketClient.on("sync", this.handleSync.bind(this));
    webSocketClient.on("operation-ack", this.handleOperationAck.bind(this));
  }

  startPeriodicSync() {
    setInterval(() => {
      if (this.shouldSync()) {
        this.syncCurrentPage();
      }
    }, this.syncInterval);
  }

  shouldSync() {
    return (
      authManager.isAuthenticated() &&
      roomManager.getCurrentRoom() &&
      !this.isSyncing &&
      Date.now() - this.lastSyncTime > this.syncInterval
    );
  }

  //HTTP数据同步方法
  async syncAnnotations(annotations) {
    if (!authManager.isAuthenticated() || !roomManager.getCurrentRoom()) {
      return null;
    }

    const pageUrl = getPageKey();
    try {
      const response = await apiClient.request("/annotations/sync", {
        method: "POST",
        body: JSON.stringify({
          roomId: roomManager.getCurrentRoom()._id,
          pageUrl,
          annotations,
          version: this.currentVersion,
        }),
      });

      const data = await response.json();
      if (data.status === "success") {
        this.lastSyncTime = Date.now();
        return data.data.annotation;
      } else {
        console.warn("同步数据获取失败：", data.message);
        return null;
      }
    } catch (error) {
      console.error("同步云端标注失败", error);
      return null;
    }
  }

  async loadAnnotations(pageUrl) {
    if (!authManager.isAuthenticated() || !roomManager.getCurrentRoom()) {
      return null;
    }

    try {
      const roomId = roomManager.getCurrentRoom()._id;
      const response = await apiClient.request(
        `/annotations/${roomId}/${encodeURIComponent(pageUrl)}`
      );

      const data = await response.json();
      if (data.status === "success" && data.data.annotation) {
        this.currentVersion = data.data.annotation.version || 0;
        return data.data.annotation.annotations;
      }
      return null;
    } catch (error) {
      console.error("加载云端标注失败:", error);
      return null;
    }
  }

  async syncCurrentPage() {
    if (this.isSyncing) {
      console.log("同步正在进行中，跳过");
      return null;
    }
    if (!authManager.isAuthenticated() || !roomManager.getCurrentRoom()) {
      return null;
    }
    this.isSyncing = true;

    try {
      const pageData = await getPageData();
      const result = await this.syncAnnotations(pageData);
      // 处理待处理的操作
      if (this.pendingOperations.length > 0) {
        await this.processPendingOperations();
      }
      return result;
    } catch (error) {
      console.error("同步云端最新数据失败:", error);
      return null;
    } finally {
      this.isSyncing = false;
    }
  }

  async loadCurrentPageFromCloud() {
    if (!authManager.isAuthenticated() || !roomManager.getCurrentRoom()) {
      return false;
    }

    try {
      const pageUrl = getPageKey();
      const cloudData = await this.loadAnnotations(pageUrl);

      if (cloudData) {
        await saveMultiplePageData({
          bookmarks: cloudData.bookmarks || [],
          canvas: cloudData.canvas || "",
          rectangles: cloudData.rectangles || [],
          images: cloudData.images || [],
        });
        chrome.runtime.sendMessage({ type: "RELOAD" });
        return true;
      }
      return false;
    } catch (error) {
      console.error("将云端当前页面数据加载到本地失败:", error);
      return false;
    }
  }

  async processPendingOperations() {
    const operations = [...this.pendingOperations];
    this.pendingOperations = [];

    for (const operation of operations) {
      try {
        await this.sendOperation(operation);
      } catch (error) {
        console.error("处理待处理操作失败：", error);
        this.pendingOperations.push(operation);
      }
    }
  }

  // 使用HTTP来处理实时操作处理
  sendOperation(operation) {
    console.trace();
    // 如果WebSocket可用，优先使用WebSocket
    if (webSocketClient.isConnected()) {
      return webSocketClient.sendOperation(operation, this.currentVersion);
    } else {
      // WebSocket不可用时回退
      console.log("WebSocket 不可用，操作将通过HTTP同步");
      this.pendingOperations.push(operation);
      return false;
    }
  }

  // 各类数据的合并和本地存储
  async handleRemoteOperation(message) {
    const { operation, version } = message;
    // 检查操作版本，避免旧操作
    if (version < this.currentVersion) return;

    this.currentVersion = version;

    try {
      switch (operation.type) {
        case "bookmark-add":
          await this.mergeData("bookmarks", (bookmarks) => [
            ...bookmarks,
            operation.data,
          ]);
          break;
        case "bookmark-update":
          await this.mergeData("bookmarks", (bookmarks) =>
            bookmarks.map((b) =>
              b.id === operation.data.id ? operation.data : b
            )
          );
          break;
        case "bookmark-delete":
          await this.mergeData("bookmarks", (bookmarks) =>
            bookmarks.filter((b) => b.id !== operation.data.id)
          );
          break;
        case "canvas-update":
          await savePageData("canvas", operation.data);
          break;
        case "rectangle-add":
          await this.mergeData("rectangles", (rectangles) => [
            ...rectangles,
            operation.data,
          ]);
          break;
        case "rectangle-update":
          await this.mergeData("rectangles", (rectangles) =>
            rectangles.map((r) =>
              r.id === operation.data.id ? operation.data : r
            )
          );
          break;
        case "rectangle-delete":
          await this.mergeData("rectangles", (rectangles) =>
            rectangles.filter((r) => r.id !== operation.data.id)
          );
          break;
        case "image-add":
          await this.mergeData("images", (images) => [
            ...images,
            operation.data,
          ]);
          break;
        case "image-update":
          await this.mergeData("images", (images) =>
            images.map((i) => (i.id === operation.data.id ? operation.data : i))
          );
          break;
        case "image-delete":
          await this.mergeData("images", (images) =>
            images.filter((i) => i.id !== operation.data.id)
          );
          break;
        default:
          console.warn("未知的远程操作类型:", operation.type);
      }
    } catch (error) {
      console.error("处理远程操作失败:", error);
    }
  }

  async mergeData(dataType, mergeFunction) {
    const currentData = await getPageDataByType(dataType);
    const newData = mergeFunction(currentData);
    await savePageData(dataType, newData);
  }

  handleOperationAck(message) {
    const { version } = message;
    this.currentVersion = Math.max(this.currentVersion, version);
  }

  handleSync(message) {
    const { annotations, version } = message;
    this.currentVersion = Math.max(this.currentVersion, version);

    if (annotations) {
      saveMultiplePageData({
        bookmarks: annotations.bookmarks || [],
        canvas: annotations.canvas || "",
        rectangles: annotations.rectangles || [],
        images: annotations.images || [],
      });
    }
  }

  /* 工具方法 */
  getCurrentVersion() {
    return this.currentVersion;
  }

  getPendingOperations() {
    return this.pendingOperations;
  }

  clearPendingOperations() {
    this.pendingOperations = [];
  }

  // 强制同步
  async forceSync() {
    this.lastSyncTime = 0;
    return this.syncCurrentPage();
  }
}

export const syncManager = new SyncManager();
