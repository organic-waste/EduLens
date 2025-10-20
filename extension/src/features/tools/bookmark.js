//创建定位书签
import eventStore from "../../stores/eventStore.js";
import MonitorSPARoutes from "../../utils/monitorSPARoutes.js";
import { getId, getPageKey } from "../../utils/getIdentity.js";
import { createEl } from "../../utils/operateEl.js";
import {
  getPageData,
  getPageDataByType,
  savePageData,
} from "../../utils/storageManager.js";

let addDiv = null;
let btnDiv = null;
let funcDiv = null;
let inputDiv = null;
let oldPageKey = null;

function createBookmarkEle(scrollTop, text, id) {
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  const docHeight = document.documentElement.scrollHeight;
  const winHeight = window.innerHeight;
  const progressPct = (scrollTop / (docHeight - winHeight)) * 100;
  const percent = Math.round(progressPct);

  const bookmarkDiv = createEl("div", {
    class: "bookmark-marker",
    style: `top:${percent - 2}%;`,
    "data-id": id,
  });
  const tooltip = createEl("div", {
    class: "bookmark-tooltip",
    style: `top:${percent - 2}%;`,
    textContent: text,
  });
  const deleteBtn = createEl("button", {
    class: "delete-button",
    textContent: "×",
  });
  eventStore.on(deleteBtn, "click", (e) => {
    e.stopPropagation();
    removeBookmark(bookmarkDiv);
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

  const scrollDiv = shadowRoot.querySelector(".scroll-percent");
  scrollDiv.appendChild(bookmarkDiv);
  switchPanel(true);
}

async function saveBookmark(scrollTop, text, id) {
  let bookmarks = await getPageDataByType("bookmarks");
  const newBookmark = {
    scrollTop: scrollTop,
    text: text,
    id: id,
  };

  bookmarks.push(newBookmark);
  await savePageData("bookmarks", bookmarks);
  createBookmarkEle(scrollTop, text, id);
}

async function removeBookmark(el) {
  const id = el.dataset.id;
  let bookmarks = await getPageDataByType("bookmarks");

  const updatedBookmarks = bookmarks.filter((item) => item.id !== id);
  await savePageData("bookmarks", updatedBookmarks);
  el.remove();
}

async function loadBookmarks() {
  const pageKey = getPageKey();
  if (pageKey === oldPageKey) return;

  const bookmarks = await getPageDataByType("bookmarks");
  bookmarks.forEach((item) =>
    createBookmarkEle(item.scrollTop, item.text, item.id)
  );
  oldPageKey = pageKey;
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

  loadBookmarks();
  MonitorSPARoutes(loadBookmarks);

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "RELOAD") {
      loadBookmarks();
    }
  });
}
