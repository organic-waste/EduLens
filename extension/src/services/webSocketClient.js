/* WebSocket实时通信 */
import { webSocket } from "./webSocket.js";
import { authManager } from "./authManager.js";
import { getPageKey } from "../utils/index.js";
import { roomManager } from "./roomManager.js";

class WebSocketClient {
  constructor() {
    this.wsConnected = false;
    this.currentRoomId = null;
    this.currentPageUrl = null;
    this.messageHandlers = new Map();
    this.wsURL = import.meta.env.VITE_WS_URL;
    this.isConnecting = false;
  }

  async connect() {
    if (this.wsConnected || !authManager.getToken()) {
      return false;
    }
    return new Promise(async (resolve, reject) => {
      try {
        await webSocket.connect(this.wsURL);
        webSocket.authenticate(authManager.getToken());

        // 注册内置消息处理器
        webSocket.on("operation", this.handleOperation.bind(this));
        webSocket.on("sync", this.handleSync.bind(this));
        webSocket.on("operation-ack", this.handleOperationAck.bind(this));
        webSocket.on("error", this.handleError.bind(this));
        webSocket.on("close", this.handleClose.bind(this));
        webSocket.on(
          "authentication-success",
          this.handleAuthSuccess.bind(this)
        );

        this.wsConnected = true;
        console.log("[EduLens] WebSocket 连接成功");

        // 如果已有房间信息，先设置好（认证成功后会自动加入）
        if (!this.currentRoomId) {

          const currentRoom = roomManager.getCurrentRoom();
          if (currentRoom) {
            this.currentRoomId = currentRoom._id;
            this.currentPageUrl = getPageKey();
          }
        }

        resolve(true);
      } catch (error) {
        console.warn("[EduLens] WebSocket 连接失败:", error);
        this.wsConnected = false;
        reject(false);
      } finally {
        this.isConnecting = false;
      }
    });
  }

  disconnect() {
    if (this.wsConnected) {
      webSocket.disconnect();
      this.wsConnected = false;
      this.currentRoomId = null;
      this.currentPageUrl = null;
    }
  }

  async joinRoom(roomId, pageUrl) {
    if (!this.wsConnected) {
      console.warn(`[EduLens] WebSocket未连接，无法加入房间 ${roomId}`);
      return false;
    }

    this.currentRoomId = roomId;
    this.currentPageUrl = pageUrl;
    try {
      return await webSocket.joinRoom(roomId, pageUrl);
    } catch (error) {
      console.error("[EduLens] 加入房间失败:", error);
      return false;
    }
  }

  sendOperation(operation, clientVersion) {
    if (!this.wsConnected) return false;
    return webSocket.sendOperation(operation, clientVersion);
  }

  /* 消息处理方法 */
  handleOperation(message) {
    this.emit("operation", message);
  }

  handleSync(message) {
    this.emit("sync", message);
  }

  handleOperationAck(message) {
    this.emit("operation-ack", message);
  }

  handleError(message) {
    console.error("WebSocket 错误:", message);
    this.wsConnected = false;
    this.emit("error", message);
  }

  handleClose(message) {
    console.log("WebSocket 连接关闭:", message);
    this.wsConnected = false;
    this.emit("close", message);
  }

  async handleAuthSuccess(message) {
    console.log("WebSocket 认证成功:", message);
    this.emit("authenticated", message);
    
    // 认证成功后，自动加入当前房间
    try {
      if (this.currentRoomId) {
        // 如果已有房间ID，直接加入
        await this.joinRoom(
          this.currentRoomId,
          this.currentPageUrl || getPageKey()
        );
      } else {
        // 如果没有，尝试从 roomManager 获取当前房间并加入
        const currentRoom = roomManager.getCurrentRoom();
        if (currentRoom) {
          const pageUrl = getPageKey();
          await this.joinRoom(currentRoom._id, pageUrl);
        }
      }
    } catch (error) {
      console.warn("[EduLens] 自动加入房间失败:", error);
    }
  }

  /* 事件系统 */
  on(eventType, handler) {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    this.messageHandlers.get(eventType).push(handler);
  }

  off(eventType, handler) {
    if (this.messageHandlers.has(eventType)) {
      const handlers = this.messageHandlers.get(eventType);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(eventType, data) {
    if (this.messageHandlers.has(eventType)) {
      this.messageHandlers.get(eventType).forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`处理${eventType}事件时出错:`, error);
        }
      });
    }
  }

  isConnected() {
    return this.wsConnected;
  }
}

export const webSocketClient = new WebSocketClient();
