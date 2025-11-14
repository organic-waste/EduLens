/* 滚动进度 */
import eventStore from "../../stores/eventStore.js";

let isActive = false;
let currentPercent = 0;
const subscribers = new Set();

function notifySubscribers() {
  subscribers.forEach((cb) => {
    try {
      cb(currentPercent);
    } catch (error) {
      console.error("[EduLens] 滚动订阅回调异常", error);
    }
  });
}

function updateScrollProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight || 1;
  const winHeight = window.innerHeight || 1;
  const progressPct = (scrollTop / Math.max(docHeight - winHeight, 1)) * 100;
  currentPercent = Math.max(0, Math.min(100, Math.round(progressPct)));
  notifySubscribers();
}

export function activateScrollProgress(callback) {
  if (callback) {
    subscribers.add(callback);
  }

  if (isActive) {
    callback?.(currentPercent);
    return;
  }

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
