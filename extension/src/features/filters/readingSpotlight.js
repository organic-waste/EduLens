/* 阅读聚光灯 */
import eventStore from "../../stores/eventStore.js";
import { createEl } from "../../utils/index.js";

const pointerState = {
  y: window.innerHeight / 2,
};
const MIN_HEIGHT = 20;
const HEIGHT_STEP = 12;

let readingSpotlightDiv = null;
let isActive = false;
let spotlightHeight = 60;
let rafId = null;

function ensureReadingSpotlight() {
  if (readingSpotlightDiv) return;
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  readingSpotlightDiv = createEl("div", { class: "reading-spotlight" });
  Object.assign(readingSpotlightDiv.style, { left: "0px", top: "0px" });
  shadowRoot.appendChild(readingSpotlightDiv);
  updateSpotlightHeight(spotlightHeight);
}

function updateSpotlightHeight(nextHeight) {
  const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight - 40);
  spotlightHeight = Math.min(maxHeight, Math.max(MIN_HEIGHT, nextHeight));
  if (readingSpotlightDiv) {
    readingSpotlightDiv.style.height = `${spotlightHeight}px`;
  }
  scheduleRender();
}

function renderSpotlight() {
  if (!readingSpotlightDiv) return;
  const maxTop = window.innerHeight - spotlightHeight;
  const top = Math.min(
    Math.max(pointerState.y - spotlightHeight / 2, 0),
    maxTop
  );
  readingSpotlightDiv.style.transform = `translateY(${top}px)`;
  rafId = null;
}

function scheduleRender() {
  if (rafId) return;
  rafId = requestAnimationFrame(renderSpotlight);
}

function handlePointerMove(e) {
  pointerState.y = e.clientY;
  scheduleRender();
}

function handleWheel(e) {
  if (!isActive || !e.altKey) return;
  e.preventDefault();
  const delta = e.deltaY > 0 ? HEIGHT_STEP : -HEIGHT_STEP;
  updateSpotlightHeight(spotlightHeight + delta);
}

function handleResize() {
  scheduleRender();
}

export function activateReadingSpotlight() {
  if (isActive) return;
  isActive = true;
  ensureReadingSpotlight();
  readingSpotlightDiv.style.display = "block";
  scheduleRender();
  eventStore.on(document, "pointermove", handlePointerMove);
  eventStore.on(document, "wheel", handleWheel, { passive: false });
  eventStore.on(window, "resize", handleResize);
}

export function deactivateReadingSpotlight() {
  if (!isActive) return;
  isActive = false;
  eventStore.off(document, "pointermove", handlePointerMove);
  eventStore.off(document, "wheel", handleWheel);
  eventStore.off(window, "resize", handleResize);
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (readingSpotlightDiv) {
    readingSpotlightDiv.remove();
    readingSpotlightDiv = null;
  }
  spotlightHeight = 120;
}
