/* 定位书签 */
import eventStore from "../../stores/eventStore.js";
import { MonitorSPARoutes } from "../../utils/index.js";
import { getId, getPageKey, createEl } from "../../utils/index.js";
import { storageManager, syncManager } from "../../services/index.js";

let shadowRoot = null;
let bookmarks = [];
let cachedPageKey = null;
const subscribers = new Set();

function notify() {
  const snapshot = [...bookmarks];
  subscribers.forEach((cb) => {
    try {
      cb(snapshot);
    } catch (error) {
      console.error("[EduLens] bookmark subscriber error", error);
    }
  });
}

function percentFromScrollTop(scrollTop) {
  const docHeight = document.documentElement.scrollHeight || 1;
  const winHeight = window.innerHeight || 1;
  const progressPct = (scrollTop / Math.max(docHeight - winHeight, 1)) * 100;
  return Math.max(0, Math.min(100, Math.round(progressPct)));
}

function createBookmarkElement(bookmark) {
  const scrollDiv = shadowRoot?.querySelector(".scroll-percent");
  if (!scrollDiv) return;

  const percent = percentFromScrollTop(bookmark.scrollTop);
  const bookmarkDiv = createEl("div", {
    class: "bookmark-marker",
    style: `top:${percent - 2}%;`,
    "data-id": bookmark.id,
  });
  const tooltip = createEl("div", {
    class: "bookmark-tooltip",
    style: `top:${percent - 2}%;`,
    textContent: bookmark.text,
  });
  const deleteBtn = createEl("button", {
    class: "delete-button",
    textContent: "×",
  });

  eventStore.on(deleteBtn, "click", async (e) => {
    e.stopPropagation();
    await deleteBookmark(bookmark.id);
  });

  tooltip.append(deleteBtn);
  bookmarkDiv.append(tooltip);

  let hideTimer = null;
  const delayHide = () => {
    hideTimer = setTimeout(() => {
      tooltip.style.opacity = "0";
      tooltip.style.pointerEvents = "none";
    }, 500);
  };
  const showTooltip = () => {
    if (hideTimer) clearTimeout(hideTimer);
    tooltip.style.opacity = "1";
    tooltip.style.pointerEvents = "all";
  };

  eventStore.on(bookmarkDiv, "mouseenter", showTooltip);
  eventStore.on(bookmarkDiv, "mouseleave", delayHide);
  eventStore.on(tooltip, "mouseover", showTooltip);
  eventStore.on(tooltip, "mouseleave", delayHide);

  eventStore.on(bookmarkDiv, "click", () => {
    window.scrollTo({ top: bookmark.scrollTop, behavior: "smooth" });
  });

  scrollDiv.appendChild(bookmarkDiv);
  showTooltip();
}

function renderBookmarks() {
  const scrollDiv = shadowRoot?.querySelector(".scroll-percent");
  if (!scrollDiv) return;
  scrollDiv.querySelectorAll(".bookmark-marker").forEach((el) => el.remove());
  bookmarks.forEach(createBookmarkElement);
}

async function persist(nextList) {
  await storageManager.savePageData("bookmarks", nextList);
  bookmarks = nextList;
  renderBookmarks();
  notify();
}

async function loadBookmarks(force = false) {
  const pageKey = getPageKey();
  if (!force && pageKey === cachedPageKey && bookmarks.length) {
    renderBookmarks();
    return bookmarks;
  }

  const stored = await storageManager.getPageDataByType("bookmarks");
  cachedPageKey = pageKey;
  bookmarks = stored;
  renderBookmarks();
  notify();
  return bookmarks;
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

  return next;
}

export async function deleteBookmark(id) {
  const next = bookmarks.filter((item) => item.id !== id);
  await persist(next);
  syncManager.sendOperation({
    type: "bookmark-delete",
    data: { id },
  });
  return next;
}

export function scrollToBookmark(id) {
  const target = bookmarks.find((item) => item.id === id);
  if (!target) return false;
  window.scrollTo({ top: target.scrollTop, behavior: "smooth" });
  return true;
}

export function listBookmarks() {
  return [...bookmarks];
}

export function subscribeBookmarks(callback) {
  subscribers.add(callback);
  callback?.([...bookmarks]);
  return () => subscribers.delete(callback);
}

export function activateBookmark() {
  shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  loadBookmarks(true);
  MonitorSPARoutes(() => loadBookmarks(true));

  window.__edulens_reloadBookmarks = () => loadBookmarks(true);
}
