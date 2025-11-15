/* 聚光灯 */
import eventStore from "../../stores/eventStore.js";
import { createEl } from "../../utils/index.js";

const pointerPos = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
};
const SIZE_STEP = 30;
const MIN_SIZE = 100;
const MAX_SIZE = 600;

let spotlightDiv = null;
let spotlightSize = 160;
let isActive = false;
let rafId = null;

function ensureSpotlight() {
  if (spotlightDiv) return;
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  spotlightDiv = createEl("div", { class: "spotlight" });
  Object.assign(spotlightDiv.style, { left: "0px", top: "0px" });
  shadowRoot.appendChild(spotlightDiv);
  updateSpotlightSize(spotlightSize);
}

function updateSpotlightSize(nextSize) {
  spotlightSize = Math.min(MAX_SIZE, Math.max(MIN_SIZE, nextSize));
  if (spotlightDiv) {
    spotlightDiv.style.width = `${spotlightSize}px`;
    spotlightDiv.style.height = `${spotlightSize}px`;
  }
  scheduleRender();
}

function renderSpotlight() {
  if (!spotlightDiv) return;
  const half = spotlightSize / 2;
  spotlightDiv.style.transform = `translate(${pointerPos.x - half}px, ${
    pointerPos.y - half
  }px)`;
  rafId = null;
}

function scheduleRender() {
  if (rafId) return;
  rafId = requestAnimationFrame(renderSpotlight);
}

function handlePointerMove(e) {
  pointerPos.x = e.clientX;
  pointerPos.y = e.clientY;
  scheduleRender();
}

function handleWheel(e) {
  if (!isActive || !e.altKey) return;
  e.preventDefault();
  const delta = e.deltaY > 0 ? SIZE_STEP : -SIZE_STEP;
  updateSpotlightSize(spotlightSize + delta);
}

export function activateSpotlight() {
  if (isActive) return;
  isActive = true;
  ensureSpotlight();
  scheduleRender();
  eventStore.on(document, "pointermove", handlePointerMove);
  eventStore.on(document, "wheel", handleWheel, { passive: false });
}

export function deactivateSpotlight() {
  if (!isActive) return;
  isActive = false;
  eventStore.off(document, "pointermove", handlePointerMove);
  eventStore.off(document, "wheel", handleWheel);
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (spotlightDiv) {
    spotlightDiv.remove();
    spotlightDiv = null;
  }
  spotlightSize = 160;
}
