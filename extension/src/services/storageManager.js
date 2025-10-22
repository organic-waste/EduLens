/* 管理数据存储 */

/**
 * 存储格式：
 * { [pageUrl]: { bookmarks: [], canvas: string, rectangles: [], images: [] } }
 */
import { getPageKey } from "../utils/index.js";

export async function getPageData() {
  try {
    const pageKey = getPageKey();
    const result = await chrome.storage.local.get({ [pageKey]: {} });
    return result[pageKey];
  } catch (error) {
    console.error("获取页面数据失败:", error);
    return {};
  }
}

export async function getAllPagesData() {
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
export async function savePageData(dataType, data) {
  try {
    const pageKey = getPageKey();
    const pageData = await getPageData();

    const updatedData = {
      ...pageData,
      [dataType]: data,
    };

    await chrome.storage.local.set({ [pageKey]: updatedData });
    return updatedData;
  } catch (error) {
    console.error("保存页面数据失败:", error);
  }
}

export async function getPageDataByType(dataType) {
  const pageData = await getPageData();
  return pageData[dataType] || getDefaultData(dataType);

  function getDefaultData(dataType) {
    const defaults = {
      bookmarks: [],
      canvas: "",
      rectangles: [],
      images: [],
    };
    return defaults[dataType] || null;
  }
}

export async function clearPageData() {
  try {
    const pageKey = getPageKey();
    await chrome.storage.local.remove([pageKey]);
    return true;
  } catch (error) {
    console.error("清除页面数据失败:", error);
    return false;
  }
}
