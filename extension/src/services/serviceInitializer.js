/* 服务初始化文件 */
import { authManager } from "./authManager.js";
import { roomManager } from "./roomManager.js";
import { webSocketClient } from "./webSocketClient.js";
import { syncManager } from "./syncManager.js";
import { webSocket } from "./webSocket.js";

class ServiceInitializer {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // 1. 初始化认证管理器
      const authInitialized = await authManager.init();
      console.log("[EduLens] 认证初始化结果:", authInitialized);

      // 2. 如果用户已登录，初始化其他服务
      if (authManager.isAuthenticated()) {
        console.log("[EduLens] 用户已认证，开始初始化其他服务");

        await webSocketClient.connect();
        console.log(
          "[EduLens] WebSocket连接状态:",
          webSocketClient.isConnected()
        );

        await roomManager.loadUserRooms();
        console.log("[EduLens] 房间加载完成");

        // 自动启动定期同步
        console.log("[EduLens] 所有服务初始化完成");
        this.isInitialized = true;
      } else {
        console.log("[EduLens] 用户未认证，跳过服务初始化");
      }
    } catch (error) {
      console.error("[EduLens] 服务初始化失败:", error);
      this.isInitialized = false;
    }
  }

  async reinitialize() {
    this.isInitialized = false;
    await this.initialize();
  }
}

export const serviceInitializer = new ServiceInitializer();
