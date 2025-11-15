/* 定位书签 */
import eventStore from "../../stores/eventStore.js";
import { MonitorSPARoutes } from "../../utils/index.js";
import { getId, getPageKey, createEl } from "../../utils/index.js";
import { storageManager, syncManager } from "../../services/index.js";

let addDiv = null;
let btnDiv = null;
let funcDiv = null;
let inputDiv = null;
let oldPageKey = null;
let cachedBookmarks = [];
let renderFrameId = null;

function clampPercent(percent) {
  const safe = Math.max(0, Math.min(percent, 100));
  return Math.max(0, Math.min(safe - 2, 98));
}

function getScrollableHeight() {
  const docHeight = Math.max(
    document.documentElement?.scrollHeight || 0,
    document.body?.scrollHeight || 0
  );
  const winHeight = window.innerHeight || 0;
  return Math.max(docHeight - winHeight, 1);
}

function calculateScrollPercent(scrollTop) {
  const percent = scrollTop / getScrollableHeight();
  if (Number.isNaN(percent) || !Number.isFinite(percent)) {
    return 0;
  }
  return Math.max(0, Math.min(percent, 1));
}

function getBookmarkPercent(bookmark) {
  if (typeof bookmark.scrollPercent === "number") {
    return bookmark.scrollPercent * 100;
  }
  return calculateScrollPercent(bookmark.scrollTop) * 100;
}

function createBookmarkEle(bookmark) {
  const { scrollTop, text, id } = bookmark;
  const percent = Math.round(getBookmarkPercent(bookmark));
  const topPercent = clampPercent(percent);
  const bookmarkDiv = createEl("div", {
    class: "bookmark-marker",
    style: `top:${topPercent}%;`,
    "data-id": id,
  });
  const tooltip = createEl("div", {
    class: "bookmark-tooltip",
    style: `top:${topPercent}%;`,
    textContent: text,
  });
  const deleteBtn = createEl("button", {
    class: "delete-button",
    textContent: "×",
  });
  eventStore.on(deleteBtn, "click", (e) => {
    e.stopPropagation();
    removeBookmark(id);
  });

  tooltip.append(deleteBtn);
  bookmarkDiv.append(tooltip);

  let closePanel = null;
  function switchPanel(method) {
    if (!method) {
      closePanel = setTimeout(() => {
        tooltip.style.opacity = "0";
        tooltip.style.pointerEvents = "none";
      }, 500);
    } else {
      if (closePanel) clearTimeout(closePanel);
    }
  }

  eventStore.on(bookmarkDiv, "mouseenter", () => {
    tooltip.style.opacity = "1";
    tooltip.style.pointerEvents = "all";
    switchPanel(true);
  });
  eventStore.on(bookmarkDiv, "mouseleave", () => {
    switchPanel(false);
  });

  eventStore.on(tooltip, "mouseover", () => {
    switchPanel(true);
  });
  eventStore.on(tooltip, "mouseleave", () => {
    switchPanel(false);
  });

  eventStore.on(bookmarkDiv, "click", () => {
    window.scrollTo({
      top: scrollTop,
      behavior: "smooth",
    });
  });

  switchPanel(true);
  return bookmarkDiv;
}

function renderBookmarks() {
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  if (!shadowRoot) return;
  const scrollDiv = shadowRoot.querySelector(".scroll-percent");
  if (!scrollDiv) return;

  scrollDiv.querySelectorAll(".bookmark-marker").forEach((node) => node.remove());
  cachedBookmarks.forEach((bookmark) => {
    const marker = createBookmarkEle(bookmark);
    if (marker) {
      scrollDiv.appendChild(marker);
    }
  });
}

function scheduleRenderBookmarks() {
  if (renderFrameId) {
    cancelAnimationFrame(renderFrameId);
  }
  renderFrameId = requestAnimationFrame(() => {
    renderFrameId = null;
    renderBookmarks();
  });
}

async function saveBookmark(scrollTop, text, id) {
  let bookmarks = await storageManager.getPageDataByType("bookmarks");
  const newBookmark = {
    scrollTop: scrollTop,
    text: text,
    id: id,
    scrollPercent: calculateScrollPercent(scrollTop),
  };

  bookmarks.push(newBookmark);
  await storageManager.savePageData("bookmarks", bookmarks);
  cachedBookmarks = bookmarks;
  scheduleRenderBookmarks();

  // 发送实时同步操作
  syncManager.sendOperation({
    type: "bookmark-add",
    data: newBookmark,
  });
}

async function removeBookmark(id) {
  let bookmarks = await storageManager.getPageDataByType("bookmarks");

  const updatedBookmarks = bookmarks.filter((item) => item.id !== id);
  await storageManager.savePageData("bookmarks", updatedBookmarks);
  cachedBookmarks = cachedBookmarks.filter((item) => item.id !== id);
  scheduleRenderBookmarks();

  // 发送实时同步操作
  syncManager.sendOperation({
    type: "bookmark-delete",
    data: { id },
  });
}

async function persistMissingPercents() {
  if (!cachedBookmarks.length) return;
  let shouldPersist = false;
  const updated = cachedBookmarks.map((bookmark) => {
    if (typeof bookmark.scrollPercent !== "number") {
      shouldPersist = true;
      return { ...bookmark, scrollPercent: calculateScrollPercent(bookmark.scrollTop) };
    }
    return bookmark;
  });

  if (!shouldPersist) return;

  cachedBookmarks = updated;
  scheduleRenderBookmarks();
  try {
    await storageManager.savePageData("bookmarks", cachedBookmarks);
  } catch (error) {
    console.error("更新书签滚动百分比失败:", error);
  }
}

async function loadBookmarks(forceReload = false) {
  const pageKey = getPageKey();
  if (!forceReload && pageKey === oldPageKey && cachedBookmarks.length) {
    scheduleRenderBookmarks();
    return;
  }

  const bookmarks = await storageManager.getPageDataByType("bookmarks");
  cachedBookmarks = Array.isArray(bookmarks) ? bookmarks : [];
  scheduleRenderBookmarks();
  oldPageKey = pageKey;

  if (document.readyState === "complete") {
    persistMissingPercents();
  } else {
    eventStore.on(
      window,
      "load",
      () => {
        persistMissingPercents();
      },
      { once: true }
    );
  }
}

function createBookmark() {
  const val = inputDiv.value.trim();
  if (!val) return; //当输入为空的时候直接返回，不创建新的书签
  inputDiv.value = "";

  const id = getId();
  const scrollTop = window.scrollY;
  saveBookmark(scrollTop, val, id);
}

export function activateBookmark() {
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;

  addDiv = createEl("div", { class: "function" });
  inputDiv = createEl("input", {
    type: "text",
    class: "input",
    placeholder: chrome.i18n.getMessage("bookmarkPlaceholder"),
  });
  addDiv.appendChild(inputDiv);

  btnDiv = createEl("button", {
    class: "button",
    textContent: chrome.i18n.getMessage("bookmarkAddBtn"),
  });
  eventStore.on(btnDiv, "click", createBookmark);
  addDiv.appendChild(btnDiv);

  funcDiv = shadowRoot.querySelector(".functions");
  if (funcDiv) {
    funcDiv.appendChild(addDiv);
  }

  loadBookmarks(true);
  MonitorSPARoutes(() => loadBookmarks(true));
  eventStore.on(window, "resize", scheduleRenderBookmarks);
  if (document.readyState !== "complete") {
    eventStore.on(window, "load", () => {
      scheduleRenderBookmarks();
      persistMissingPercents();
    });
  }

  window.__edulens_reloadBookmarks = () => {
    loadBookmarks(true);
  };
}
