/* 实时协作的云同步功能 */

import { getPageKey } from "./getIdentity.js";
import { getPageData, savePageData } from "./storageManager.js";

class CloudSync {
  constructor() {
    this.baseURL = "http://localhost:3000/api";
    this.isOnline = false;
    this.token = null;
    this.user = null;
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

  async validateToken() {
    if (!this.token) return false;
    try {
      const response = await fetch(`${this.baseURL}/auth/verify`, {
        method: "GET",
        headers: {
          Authorization: `${this.token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const result = await response.json();
        this.user = result.data.user;
        this.isOnline = true;
        return true;
      }
    } catch (error) {
      console.warn("Token 验证失败：", error);
    }
    await this.clearAuth();
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
      const response = await fetch(`${this.baseURL}/test`);
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
      const response = await fetch(`${this.baseURL}/health`);
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
  async syncAnnotations(pageUrl, annotations) {
    //没登录则跳过云同步
    if (!this.isOnline || !this.token) return;

    try {
      const response = await fetch(`${this.baseURL}/annotations/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${this.token}`,
        },
        body: JSON.stringify({
          pageUrl,
          annotations,
        }),
      });
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
    if (!this.isOnline || !this.token) return;

    try {
      const response = await fetch(
        `${this.baseURL}/annotations/by-url?url=${encodeURIComponent(pageUrl)}`,
        {
          headers: {
            Authorization: `${this.token}`,
          },
        }
      );

      const data = await response.json();

      if (data.status === "success" && data.data.annotation) {
        return data.data.annotation.annotations;
      }
    } catch (error) {
      console.error("加载云端标注失败:", error);
    }
  }

  //同步云端最新数据
  async syncCurrentPage() {
    if (!this.isOnline || !this.token) return;

    try {
      const pageUrl = getPageKey();
      const pageData = await getPageData();

      return await this.syncAnnotations(pageUrl, pageData);
    } catch (error) {
      console.error("同步云端最新数据失败:", error);
    }
  }

  //将云端当前页面数据加载到本地
  async loadCurrentPageFromCloud() {
    if (!this.isOnline || !this.token) return;

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
