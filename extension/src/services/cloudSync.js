/* 实时协作的云同步功能 */
import { getPageKey } from "../utils/getIdentity.js";
import { getPageData, savePageData } from "../utils/storageManager.js";

class CloudSync {
  constructor() {
    this.baseURL = "http://localhost:3000/api";
    this.isOnline = false;
    this.token = null;
    this.user = null;
    this.currentRoomId = null;
    this.authFailureCallback = null;
  }

  async init() {
    try {
      const result = await chrome.storage.local.get([
        "cloudToken",
        "cloudUser",
      ]);
      if (result.cloudToken && result.cloudUser) {
        this.token = result.cloudToken;
        this.user = result.cloudUser;
        this.isOnline = true;
        return true;
      }
    } catch (error) {
      console.warn(error);
    }
    return false;
  }

  //设置认证失败回调（弹出重新登录页面）
  setAuthFailureCallback(callback) {
    this.authFailureCallback = callback;
  }

  async handleAuthFailure() {
    await this.clearAuth();

    if (this.onAuthFailure) {
      this.onAuthFailure();
    }
  }

  //封装请求方法，统一处理认证失效等问题
  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: this.token ? `${this.token}` : "",
          "Content-Type": "application/json",
        },
      });
      if (response.status === 401) {
        await this.handleAuthFailure();
        console.error("[EduLens] 认证已过期，请重新登录");
      }
      return response;
    } catch (error) {
      console.error(`网络请求失败: ${error.message}`);
    }
  }

  async validateToken() {
    if (!this.token) return false;
    try {
      const response = await this.makeRequest(`${this.baseURL}/auth/verify`, {
        method: "GET",
      });
      if (response.ok) {
        const result = await response.json();
        this.user = result.data.user;
        this.isOnline = true;
        console.log("[EduLens] 登录成功：", this.user.username);
        return true;
      }
    } catch (error) {
      console.warn("Token 验证失败：", error);
      //防止重复处理认证失效
      if (!error.message.includes("认证已过期")) {
        await this.clearAuth();
      }
    }
    return false;
  }

  async clearAuth() {
    this.token = null;
    this.user = null;
    this.isOnline = false;
    await chrome.storage.local.remove(["cloudToken", "cloudUser"]);
  }

  /* 测试相关 */
  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/test/connection`);
      if (response.ok) {
        this.isOnline = true;
        return true;
      }
    } catch (error) {
      console.warn("连接后端失败", error);
      this.isOnline = true;
    }
    return false;
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/test/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /* 账号操作相关 */
  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await response.json();

      if (data.status === "success") {
        this.token = data.token;
        this.user = data.data.user;
        this.isOnline = true;
      }
      await chrome.storage.local.set({
        cloudToken: this.token,
        cloudUser: this.user,
      });

      return data;
    } catch (error) {
      return { status: "error", message: "网络错误，请稍后重试" };
    }
  }

  async login(userData) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await response.json();

      if (data.status === "success") {
        this.token = data.token;
        this.user = data.data.user;
        this.isOnline = true;
      }
      await chrome.storage.local.set({
        cloudToken: this.token,
        cloudUser: this.user,
      });

      return data;
    } catch (error) {
      return { status: "error", message: "网络错误，请稍后重试" };
    }
  }

  /* 数据同步相关 */
  async syncAnnotations(annotations) {
    //没登录或没有房间则跳过云同步
    if (!this.isOnline || !this.token || !this.currentRoomId) return;
    const pageUrl = getPageKey();
    try {
      const response = await this.makeRequest(
        `${this.baseURL}/annotations/sync`,
        {
          method: "POST",
          body: JSON.stringify({
            roomId: this.currentRoomId,
            pageUrl,
            annotations,
          }),
        }
      );
      const data = await response.json();

      if (data.status === "success") {
        return data.data.annotation;
      } else {
        console.warn("同步数据获取失败：", data.message);
      }
    } catch (error) {
      console.error("同步云端标注失败", error);
    }
  }

  async loadAnnotations(pageUrl) {
    if (!this.isOnline || !this.token || !this.currentRoomId) return;

    try {
      const response = await this.makeRequest(
        `${this.baseURL}/annotations/${this.currentRoomId}/${encodeURIComponent(
          pageUrl
        )}`
      );

      const data = await response.json();

      if (data.status === "success" && data.data.annotation) {
        return data.data.annotation.annotations;
      }
    } catch (error) {
      console.error("加载云端标注失败:", error);
    }
  }

  setCurrentRoom(roomId) {
    this.currentRoomId = roomId;
    // 切换房间时重新加载数据
    this.loadCurrentPageFromCloud();
  }

  // 获取用户所有房间
  async getUserRooms() {
    if (!this.isOnline || !this.token) return [];

    try {
      const response = await this.makeRequest(`${this.baseURL}/rooms/my-rooms`);
      const data = await response.json();
      if (data.status === "success") {
        return data.data;
      }
    } catch (error) {
      console.error("获取用户房间失败:", error);
      return [];
    }
  }

  async createRoom(roomData) {
    if (!this.isOnline || !this.token) return null;

    try {
      const response = await this.makeRequest(`${this.baseURL}/rooms/create`, {
        method: "POST",
        body: JSON.stringify(roomData),
      });

      const data = await response.json();
      if (data.status === "success") {
        return data.data.room;
      } else {
        console.warn("创建房间失败：", data.message);
      }
    } catch (error) {
      console.error("创建房间失败:", error);
    }
    return null;
  }

  async joinRoom(shareCode) {
    if (!this.isOnline || !this.token) return null;

    try {
      const response = await this.makeRequest(`${this.baseURL}/rooms/join`, {
        method: "POST",
        body: JSON.stringify({ shareCode }),
      });

      const data = await response.json();
      if (data.status === "success") {
        return data.data.room;
      } else {
        console.warn("加入房间失败：", data.message);
      }
    } catch (error) {
      console.error("加入房间失败:", error);
    }
    return null;
  }

  async generateShareCode(roomId) {
    if (!this.isOnline || !this.token) return null;

    try {
      const response = await this.makeRequest(
        `${this.baseURL}/rooms/${roomId}/generate-share-code`,
        {
          method: "POST",
        }
      );

      const data = await response.json();
      if (data.status === "success") {
        return data.data.shareCode;
      }
    } catch (error) {
      console.error("生成分享码失败:", error);
    }
    return null;
  }

  //同步云端最新数据
  async syncCurrentPage() {
    if (!this.isOnline || !this.token || !this.currentRoomId) return;

    try {
      const pageData = await getPageData();
      return await this.syncAnnotations(pageData);
    } catch (error) {
      console.error("同步云端最新数据失败:", error);
    }
  }

  //将云端当前页面数据加载到本地
  async loadCurrentPageFromCloud() {
    if (!this.isOnline || !this.token || !this.currentRoomId) return;

    try {
      const pageUrl = getPageKey();
      const cloudData = await this.loadAnnotations(pageUrl);

      if (cloudData) {
        await savePageData("bookmarks", cloudData.bookmarks || []);
        await savePageData("canvas", cloudData.canvas || "");
        await savePageData("rectangles", cloudData.rectangles || []);
        await savePageData("images", cloudData.images || []);

        // 触发页面重新加载数据
        chrome.runtime.sendMessage({ type: "RELOAD" });
        return true;
      }
    } catch (error) {
      console.error("将云端当前页面数据加载到本地 :", error);
    }
    return false;
  }
}

export const cloudSync = new CloudSync();
