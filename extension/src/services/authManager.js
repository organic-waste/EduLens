/* 用户注册、登录和认证状态 */
import { apiClient } from "./apiClient.js";

class AuthManager {
  constructor() {
    this.token = null;
    this.user = null;
    this.isOnline = false;
    this.authFailureCallback = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return true;
    try {
      const result = await chrome.storage.local.get([
        "cloudToken",
        "cloudUser",
      ]);

      if (result.cloudToken && result.cloudUser) {
        this.token = result.cloudToken;
        this.user = result.cloudUser;
        apiClient.setToken(this.token);

        // 验证token有效性
        const isValid = await this.validateToken();
        if (isValid) {
          this.isOnline = true;
          this.isInitialized = true;
          return true;
        } else {
          await this.clearAuth();
        }
      }
    } catch (error) {
      console.warn("认证初始化失败:", error);
    }

    this.isInitialized = true;
    return false;
  }

  setAuthFailureCallback(callback) {
    this.authFailureCallback = callback;
  }

  async handleAuthFailure() {
    await this.clearAuth();
    if (this.authFailureCallback) {
      this.authFailureCallback();
    }
  }

  async validateToken() {
    if (!this.token) return false;
    try {
      const response = await apiClient.request("/auth/verify", {
        method: "GET",
      });
      if (response.ok) {
        const result = await response.json();
        if (result.status === "success") {
          this.user = result.data.user;
          this.isOnline = true;
          // console.log("[EduLens] 登录成功：", this.user.username);
          return true;
        }
      }
    } catch (error) {
      console.warn("Token 验证失败：", error);
      if (error.message === "UNAUTHORIZED") {
        await this.clearAuth();
      }
    }
    return false;
  }

  async clearAuth() {
    this.token = null;
    this.user = null;
    this.isOnline = false;
    this.isInitialized = false;
    apiClient.setToken(null);
    await chrome.storage.local.remove(["cloudToken", "cloudUser"]);
  }

  async register(userData) {
    try {
      const response = await apiClient.request("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });
      const data = await response.json();

      if (data.status === "success") {
        await this.setAuthData(data.token, data.data.user);
      }
      return data;
    } catch (error) {
      return {
        status: "error",
        message: chrome.i18n.getMessage("networkError"),
      };
    }
  }

  async login(userData) {
    try {
      const response = await apiClient.request("/auth/login", {
        method: "POST",
        body: JSON.stringify(userData),
      });
      const data = await response.json();

      if (data.status === "success") {
        await this.setAuthData(data.token, data.data.user);
      }
      return data;
    } catch (error) {
      return {
        status: "error",
        message: chrome.i18n.getMessage("networkError"),
      };
    }
  }

  async setAuthData(token, user) {
    this.token = token;
    this.user = user;
    this.isOnline = true;
    apiClient.setToken(token);

    await chrome.storage.local.set({
      cloudToken: token,
      cloudUser: user,
    });
  }

  isAuthenticated() {
    return this.isOnline && this.token && this.user;
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }
}

export const authManager = new AuthManager();
