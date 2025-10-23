/* 管理数据存储 */
/**
 * 存储格式：
 * { [pageUrl]: { bookmarks: [], canvas: string, rectangles: [], images: [] } }
 */
import { getPageKey } from "../utils/index.js";

class StorageManager {
  constructor() {
    // 数据类型的默认值
    this.DEFAULT_DATA = {
      bookmarks: [],
      canvas: "",
      rectangles: [],
      images: [],
      timestamp: Date.now(),
    };
  }

  // 验证数据格式
  validateData(data, dataType) {
    if (!data) return false;

    const validators = {
      bookmarks: (d) => Array.isArray(d),
      canvas: (d) => typeof d === "string",
      rectangles: (d) => Array.isArray(d),
      images: (d) => Array.isArray(d),
    };

    return validators[dataType] ? validators[dataType](data) : true;
  }

  async getPageData() {
    try {
      const pageKey = getPageKey();
      const result = await chrome.storage.local.get({ [pageKey]: {} });
      return result[pageKey];
    } catch (error) {
      console.error("获取页面数据失败:", error);
      return {};
    }
  }

  async getAllPagesData() {
    try {
      const result = await chrome.storage.local.get();
      //过滤非页面数据（如用户信息）
      const pagesData = {};
      Object.keys(result).forEach((key) => {
        if (
          key.startsWith("http") ||
          key.startsWith("https") ||
          key.includes("://")
        ) {
          pagesData[key] = result[key];
        }
      });
      return pagesData;
    } catch (error) {
      console.error("获取所有页面数据失败:", error);
      return {};
    }
  }

  //合并本地新数据和旧数据
  async savePageData(dataType, data) {
    if (!this.validateData(data, dataType)) {
      console.error(`无效的${dataType}数据格式`);
      return null;
    }

    try {
      const pageKey = getPageKey();
      const pageData = await this.getPageData();

      const updatedData = {
        ...pageData,
        [dataType]: data,
        timestamp: Date.now(),
        pageUrl: pageKey,
      };

      await chrome.storage.local.set({ [pageKey]: updatedData });
      return updatedData;
    } catch (error) {
      console.error("保存页面数据失败:", error);
      return null;
    }
  }

  async getPageDataByType(dataType) {
    const pageData = await this.getPageData();
    return pageData[dataType] || this.DEFAULT_DATA[dataType];
  }

  async clearPageData() {
    try {
      const pageKey = getPageKey();
      await chrome.storage.local.remove([pageKey]);
      return true;
    } catch (error) {
      console.error("清除页面数据失败:", error);
      return false;
    }
  }

  // 批量保存多个数据类型
  async saveMultiplePageData(dataObject) {
    try {
      const pageKey = getPageKey();
      const currentData = await this.getPageData();

      const updatedData = {
        ...currentData,
        ...dataObject,
        timestamp: Date.now(),
      };

      await chrome.storage.local.set({ [pageKey]: updatedData });
      return updatedData;
    } catch (error) {
      console.error("批量保存页面数据失败:", error);
      return null;
    }
  }

  // 获取指定页面的数据
  async getPageDataByUrl(pageUrl) {
    try {
      const result = await chrome.storage.local.get({ [pageUrl]: {} });
      return result[pageUrl];
    } catch (error) {
      console.error("获取指定页面数据失败:", error);
      return {};
    }
  }

  // 保存指定页面的数据
  async savePageDataByUrl(pageUrl, dataType, data) {
    if (!this.validateData(data, dataType)) {
      console.error(`无效的${dataType}数据格式`);
      return null;
    }

    try {
      const pageData = await this.getPageDataByUrl(pageUrl);

      const updatedData = {
        ...pageData,
        [dataType]: data,
        timestamp: Date.now(),
        pageUrl: pageUrl,
      };

      await chrome.storage.local.set({ [pageUrl]: updatedData });
      return updatedData;
    } catch (error) {
      console.error("保存指定页面数据失败:", error);
      return null;
    }
  }

  // 删除指定页面的数据
  async deletePageDataByUrl(pageUrl) {
    try {
      await chrome.storage.local.remove([pageUrl]);
      return true;
    } catch (error) {
      console.error("删除指定页面数据失败:", error);
      return false;
    }
  }

  // 获取存储使用情况
  async getStorageUsage() {
    try {
      const usage = await chrome.storage.local.getBytesInUse();
      return {
        used: usage,
        quota: chrome.storage.local.QUOTA_BYTES,
        percentage: (usage / chrome.storage.local.QUOTA_BYTES) * 100,
      };
    } catch (error) {
      console.error("获取存储使用情况失败:", error);
      return null;
    }
  }

  // 清理过期数据
  async cleanupExpiredData(maxAge = 30 * 24 * 60 * 60 * 1000) { // 默认30天
    try {
      const allData = await this.getAllPagesData();
      const now = Date.now();
      const expiredKeys = [];

      Object.keys(allData).forEach((key) => {
        const data = allData[key];
        if (data.timestamp && now - data.timestamp > maxAge) {
          expiredKeys.push(key);
        }
      });

      if (expiredKeys.length > 0) {
        await chrome.storage.local.remove(expiredKeys);
        console.log(`清理了 ${expiredKeys.length} 个过期页面数据`);
      }

      return expiredKeys.length;
    } catch (error) {
      console.error("清理过期数据失败:", error);
      return 0;
    }
  }
}

// 创建单例实例
export const storageManager = new StorageManager();

// 为了向后兼容，导出原有的函数接口
export const getPageData = () => storageManager.getPageData();
export const getAllPagesData = () => storageManager.getAllPagesData();
export const savePageData = (dataType, data) => storageManager.savePageData(dataType, data);
export const getPageDataByType = (dataType) => storageManager.getPageDataByType(dataType);
export const clearPageData = () => storageManager.clearPageData();
export const saveMultiplePageData = (dataObject) => storageManager.saveMultiplePageData(dataObject);
