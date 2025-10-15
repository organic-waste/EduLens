/* 实时协作的云同步功能 */
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

  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/test`);
      if (response.ok) {
        const data = await response.json();
        console.log("连接后端成功", data);
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
      return await response.json();
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
      return await response.json();
    } catch (error) {
      return { status: "error", message: "网络错误，请稍后重试" };
    }
  }
}

export const cloudSync = new CloudSync();
