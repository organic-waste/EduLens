/* 管理协作房间 */
import { apiClient } from "./apiClient.js";
import { authManager } from "./authManager.js";
import { webSocketClient } from "./webSocketClient.js";
import { getPageKey } from "../utils/index.js";

class RoomManager {
  constructor() {
    this.currentRoom = null;
    this.userRooms = [];
    this.isLoading = false;
  }

  async loadUserRooms() {
    if (this.isLoading) return this.userRooms;
    //如果没登录跳过加载房间
    if (!authManager.isAuthenticated()) return [];
    this.isLoading = true;
    try {
      if (!webSocketClient.isConnected()) {
        await webSocketClient.connect();
      }

      const response = await apiClient.request("/rooms/my-rooms");
      const data = await response.json();

      if (data.status === "success") {
        this.userRooms = data.data || [];

        // 无房间时创建默认房间
        if (this.userRooms.length === 0) {
          const defaultRoom = await this.createRoom({
            name: "我的个人空间",
            description: "默认个人工作区",
          });
          if (defaultRoom) {
            this.userRooms = [defaultRoom];
            await this.switchRoom(defaultRoom._id);
          }
        }
        // 无选中房间时默认取第一个
        else if (!this.currentRoom && this.userRooms.length > 0) {
          await this.switchRoom(this.userRooms[0]._id);
        }

        return this.userRooms;
      }
      return [];
    } catch (error) {
      console.error("获取用户房间失败:", error);
      this.userRooms = [];
      return [];
    } finally {
      this.isLoading = false;
    }
  }

  async switchRoom(roomId) {
    const room = this.userRooms.find((r) => r._id === roomId);
    if (!room) {
      console.warn(`房间 ${roomId} 未找到`);
      return false;
    }

    this.currentRoom = room;

    // 尝试加入WebSocket房间
    if (webSocketClient.isConnected()) {
      const pageUrl = getPageKey();
      // console.log(`[EduLens] 切换到房间 ${roomId}, 页面 ${pageUrl}`);
      const result = await webSocketClient.joinRoom(roomId, pageUrl);
      if (!result) {
        console.warn(`[EduLens] 加入房间 ${roomId} 失败`);
      }
    } else {
      // 如果WebSocket未连接，设置房间信息供连接后使用
      webSocketClient.currentRoomId = roomId;
      webSocketClient.currentPageUrl = getPageKey();
    }

    return room;
  }

  async createRoom({ name, description }) {
    if (!authManager.isAuthenticated()) return null;

    try {
      const response = await apiClient.request("/rooms/create", {
        method: "POST",
        body: JSON.stringify({ name, description }),
      });

      const data = await response.json();
      if (data.status === "success") {
        const room = data.data.room;
        this.userRooms.unshift(room);
        await this.switchRoom(room._id);
        return room;
      }
      return null;
    } catch (error) {
      console.error("创建房间失败:", error);
      return null;
    }
  }

  async joinRoom(shareCode) {
    if (!authManager.isAuthenticated()) return null;

    try {
      const response = await apiClient.request("/rooms/join", {
        method: "POST",
        body: JSON.stringify({ shareCode }),
      });

      const data = await response.json();
      if (data.status === "success") {
        const room = data.data.room;
        // 防止重复加入房间
        const existIndex = this.userRooms.findIndex((r) => r._id === room._id);
        if (existIndex === -1) {
          this.userRooms.unshift(room);
        }
        await this.switchRoom(room._id);
        return room;
      }
      return null;
    } catch (error) {
      console.error("加入房间失败:", error);
      return null;
    }
  }

  async generateShareCode() {
    if (!this.currentRoom || !authManager.isAuthenticated()) return null;

    try {
      const response = await apiClient.request(
        `/rooms/${this.currentRoom._id}/generate-share-code`,
        {
          method: "POST",
        }
      );

      const data = await response.json();
      if (data.status === "success") {
        return data.data.shareCode;
      }
      return null;
    } catch (error) {
      console.error("生成分享码失败:", error);
      return null;
    }
  }

  getCurrentRoom() {
    return this.currentRoom;
  }

  getUserRooms() {
    return this.userRooms;
  }

  hasRooms() {
    return this.userRooms.length > 0;
  }
}

export const roomManager = new RoomManager();
