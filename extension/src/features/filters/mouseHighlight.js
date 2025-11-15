/* 鼠标高亮 */
import eventStore from "../../stores/eventStore.js";
import { createEl } from "../../utils/index.js";

const pointerPos = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
};

let highlightDiv = null;
let isActive = false;
let rafId = null;

function ensureHighlight() {
  if (highlightDiv) return;
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  highlightDiv = createEl("div", { class: "mouse-highlight" });
  Object.assign(highlightDiv.style, { left: "0px", top: "0px" });
  shadowRoot.appendChild(highlightDiv);
}

function renderHighlight() {
  if (!highlightDiv) return;
  const offset = highlightDiv.offsetWidth / 2;
  highlightDiv.style.transform = `translate(${pointerPos.x - offset}px, ${
    pointerPos.y - offset
  }px)`;
  rafId = null;
}

function scheduleRender() {
  if (rafId) return;
  rafId = requestAnimationFrame(renderHighlight);
}

function handlePointerMove(e) {
  pointerPos.x = e.clientX;
  pointerPos.y = e.clientY;
  scheduleRender();
}

export function activateHighlight() {
  if (isActive) return;
  isActive = true;
  ensureHighlight();
  scheduleRender();
  eventStore.on(document, "pointermove", handlePointerMove);
}

export function deactivateHighlight() {
  if (!isActive) return;
  isActive = false;
  eventStore.off(document, "pointermove", handlePointerMove);
  // 记得取消 AnimationFrame
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (highlightDiv) {
    highlightDiv.remove();
    highlightDiv = null;
  }
}
