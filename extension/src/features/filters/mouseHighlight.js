/* 鼠标高亮 */
import eventStore from "../../stores/eventStore.js";
import { createEl } from "../../utils/index.js";

const pointerPos = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
};

const HIGHLIGHT_SIZE = 32;

let highlightDiv = null;
let isActive = false;
let rafId = null;

function ensureHighlight() {
  if (highlightDiv) return;
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  highlightDiv = createEl("div", { class: "mouse-highlight" });
  // 初始位置设为负数，避免刚加载时在左上角闪烁
  Object.assign(highlightDiv.style, {
    width: `${HIGHLIGHT_SIZE}px`,
    height: `${HIGHLIGHT_SIZE}px`,
    left: "0px",
    top: "0px",
    transform: "translate(-100px, -100px)",
  });
  shadowRoot.appendChild(highlightDiv);
}

function renderHighlight() {
  if (!highlightDiv) return;
  const offset = HIGHLIGHT_SIZE / 2;
  // 使用 translate3d 开启硬件加速
  highlightDiv.style.transform = `translate3d(${pointerPos.x - offset}px, ${
    pointerPos.y - offset
  }px, 0)`;
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

//点击生成波纹
function handlePointerDown(e) {
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  if (!shadowRoot) return;

  const ripple = createEl("div", { class: "mouse-click-ripple" });

  Object.assign(ripple.style, {
    left: `${e.clientX}px`,
    top: `${e.clientY}px`,
  });

  shadowRoot.appendChild(ripple);

  ripple.addEventListener(
    "animationend",
    () => {
      ripple.remove();
    },
    { once: true }
  );
}

export function activateHighlight() {
  if (isActive) return;
  isActive = true;
  ensureHighlight();
  scheduleRender();

  eventStore.on(document, "pointermove", handlePointerMove);
  eventStore.on(document, "pointerdown", handlePointerDown);
}

export function deactivateHighlight() {
  if (!isActive) return;
  isActive = false;

  eventStore.off(document, "pointermove", handlePointerMove);
  eventStore.off(document, "pointerdown", handlePointerDown);

  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (highlightDiv) {
    highlightDiv.remove();
    highlightDiv = null;
  }
}
