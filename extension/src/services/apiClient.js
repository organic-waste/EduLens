/* HTTP请求 */
class ApiClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL;
    this.token = null;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
      },
    };
    // 只有当token存在时才添加Authorization头
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      if (response.status === 401) {
        // 清除无效token
        this.token = null;
        throw new Error("UNAUTHORIZED");
      }

      // 当检测到服务器错误，尝试进行重传
      if (response.status >= 500 && this.retryCount < this.maxRetries) {
        this.retryCount++;
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * this.retryCount)
        );
        return this.request(endpoint, options);
      }
      this.retryCount = 0;

      return response;
    } catch (error) {
      if (error.message === "UNAUTHORIZED") {
        throw error;
      }
      throw new Error(`网络请求失败: ${error.message}`);
    }
  }

  /* 测试连接 */
  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/test/connection`, {
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/test/health`, {
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const apiClient = new ApiClient();
