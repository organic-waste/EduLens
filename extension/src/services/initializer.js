/* 服务初始化文件 */
import { authManager } from "./authManager.js";
import { roomManager } from "./roomManager.js";
import { webSocketClient } from "./webSocketClient.js";
import { syncManager } from "./syncManager.js";

class ServiceInitializer {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // 1. 初始化认证管理器
      await authManager.init();

      // 2. 如果用户已登录，初始化其他服务
      if (authManager.isAuthenticated()) {
        // 初始化房间管理器
        await roomManager.loadUserRooms();

        // 初始化WebSocket连接
        await webSocketClient.connect();

        // 同步管理器会自动启动定期同步
        console.log("[EduLens] 所有服务初始化完成");
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("[EduLens] 服务初始化失败:", error);
    }
  }

  async reinitialize() {
    this.isInitialized = false;
    await this.initialize();
  }
}

export const serviceInitializer = new ServiceInitializer();
