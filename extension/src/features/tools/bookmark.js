/* 定位书签 */
import { MonitorSPARoutes, getId, getPageKey } from "../../utils/index.js";
import { storageManager, syncManager } from "../../services/index.js";

let bookmarks = [];
let cachedPageKey = null;
const subscribers = new Set();

function withPercent(entry) {
  return {
    ...entry,
    percent: percentFromScrollTop(entry.scrollTop),
  };
}

function getFormattedBookmarks() {
  return bookmarks.map(withPercent);
}

function notify() {
  const snapshot = getFormattedBookmarks();
  subscribers.forEach((cb) => {
    try {
      cb(snapshot);
    } catch (error) {
      console.error("[EduLens] 书签订阅回调异常", error);
    }
  });
}

function percentFromScrollTop(scrollTop) {
  const docHeight = document.documentElement.scrollHeight || 1;
  const winHeight = window.innerHeight || 1;
  const progressPct = (scrollTop / Math.max(docHeight - winHeight, 1)) * 100;
  return Math.max(0, Math.min(100, Math.round(progressPct)));
}

async function persist(nextList) {
  await storageManager.savePageData("bookmarks", nextList);
  bookmarks = nextList;
  notify();
}

async function loadBookmarks(force = false) {
  const pageKey = getPageKey();
  if (!force && pageKey === cachedPageKey && bookmarks.length) {
    notify();
    return getFormattedBookmarks();
  }

  const stored = await storageManager.getPageDataByType("bookmarks");
  cachedPageKey = pageKey;
  bookmarks = Array.isArray(stored) ? stored : [];
  notify();
  return getFormattedBookmarks();
}

export async function addBookmark(text) {
  const trimmed = text.trim();
  if (!trimmed) return listBookmarks();

  const newBookmark = {
    id: getId(),
    scrollTop: window.scrollY,
    text: trimmed,
  };

  const next = [...bookmarks, newBookmark];
  await persist(next);

  syncManager.sendOperation({
    type: "bookmark-add",
    data: newBookmark,
  });

  return listBookmarks();
}

export async function deleteBookmark(id) {
  const next = bookmarks.filter((item) => item.id !== id);
  await persist(next);
  syncManager.sendOperation({
    type: "bookmark-delete",
    data: { id },
  });
  return listBookmarks();
}

export function scrollToBookmark(id) {
  const target = bookmarks.find((item) => item.id === id);
  if (!target) return false;
  window.scrollTo({ top: target.scrollTop, behavior: "smooth" });
  return true;
}

export function listBookmarks() {
  return getFormattedBookmarks();
}

export function subscribeBookmarks(callback) {
  subscribers.add(callback);
  callback?.(getFormattedBookmarks());
  return () => subscribers.delete(callback);
}

export function activateBookmark() {
  loadBookmarks(true);
  MonitorSPARoutes(() => loadBookmarks(true));

  window.__edulens_reloadBookmarks = () => loadBookmarks(true);
}
