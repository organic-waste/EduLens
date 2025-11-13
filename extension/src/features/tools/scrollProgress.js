/* 滚动进度指示器 */
import eventStore from "../../stores/eventStore.js";
import { createEl } from "../../utils/index.js";

let scrollDiv = null;
let fillDiv = null;
let isActive = false;
let currentPercent = 0;
const subscribers = new Set();

function notifySubscribers() {
  subscribers.forEach((cb) => {
    try {
      cb(currentPercent);
    } catch (error) {
      console.error("[EduLens] scroll subscriber error", error);
    }
  });
}

function updateScrollProgress() {
  if (!scrollDiv) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight || 1;
  const winHeight = window.innerHeight || 1;
  const progressPct = (scrollTop / Math.max(docHeight - winHeight, 1)) * 100;
  currentPercent = Math.max(0, Math.min(100, Math.round(progressPct)));
  fillDiv.style.height = currentPercent + "%";
  notifySubscribers();
}

function ensureScrollBar() {
  if (scrollDiv) return;
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  scrollDiv = createEl("div", { class: "scroll-percent" });
  fillDiv = createEl("div", { class: "scroll-fill" });
  scrollDiv.appendChild(fillDiv);
  shadowRoot.appendChild(scrollDiv);
}

export function activateScrollProgress(callback) {
  if (callback) {
    subscribers.add(callback);
  }

  if (isActive) {
    callback?.(currentPercent);
    return;
  }

  ensureScrollBar();
  eventStore.on(window, "scroll", updateScrollProgress);
  isActive = true;
  updateScrollProgress();
}

export function subscribeScrollProgress(callback) {
  subscribers.add(callback);
  callback?.(currentPercent);
  return () => subscribers.delete(callback);
}

export function getScrollPercent() {
  return currentPercent;
}
