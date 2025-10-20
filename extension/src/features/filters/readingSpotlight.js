// 阅读聚光灯
import eventStore from "../../stores/eventStore.js";
import { createEl } from "../../utils/operateEl.js";

let readingSpotlightDiv = null;

function ReadingSpotlight(e) {
  if (!readingSpotlightDiv) return;

  // 计算聚光灯位置
  const spotlightHeight = 6; // 6vh
  const vh = window.innerHeight / 100;
  const topPosition = e.clientY - (spotlightHeight * vh) / 2;

  readingSpotlightDiv.style.transform = `translateY(${topPosition}px)`;
}

export function activateReadingSpotlight() {
  if (!readingSpotlightDiv) {
    const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
    readingSpotlightDiv = createEl("div", { class: "reading-spotlight" });
    shadowRoot.appendChild(readingSpotlightDiv);

    const vh = window.innerHeight / 100;
    const initialTop = window.innerHeight / 2 - (6 * vh) / 2;
    readingSpotlightDiv.style.transform = `translateY(${initialTop}px)`;
  }

  readingSpotlightDiv.style.display = "block";
  eventStore.on(document, "mousemove", ReadingSpotlight);
}

export function deactivateReadingSpotlight() {
  eventStore.off(window, "mousemove", ReadingSpotlight);
  if (readingSpotlightDiv) {
    readingSpotlightDiv.style.display = "none";
  }
}
