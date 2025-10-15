/* 实时协作的云同步功能 */
class CloudSync {
  constructor() {
    this.baseURL = "http://localhost:3000/api";
    this.isOnline = false;
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
