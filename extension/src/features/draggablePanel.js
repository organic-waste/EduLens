// 可拖动卡片面板
import eventManager from "../utils/eventManager.js";
import store from "../stores/filters.js";
import { getOffsetPos, createEl } from "../utils/operateEl.js";

import { activateScrollProgress } from "./tools/scrollProgress.js";
import { activateBookmark } from "./tools/bookmark.js";
import { activateGraffiti } from "./tools/graffiti.js";
import { activateCountdown } from "./tools/countdownTimer.js";
import { activateScreenshot } from "./tools/screenshot.js";
import { activateLogin } from "./accounts/login.js";

let panelDiv = null;
let cardDiv = null;
let isOpen = false;
let isMoved = false;
let offsetX = 0,
  offsetY = 0;
let Position = { left: 0, top: 0 };

function DraggablePanel() {
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  if (panelDiv) return;
  panelDiv = document.createElement("div");
  panelDiv.className = "draggable-panel";
  panelDiv.innerHTML = `
        <button class="toggle-btn">
            <svg viewBox="0 0 24 24" class="icon">
                <g class="cross">
                <line x1="3"  y1="12" x2="21" y2="12" />
                <line x1="12" y1="3"  x2="12" y2="21" />
                </g>
            </svg>
        </button>
        `;

  shadowRoot.appendChild(panelDiv);
  let btnDiv = panelDiv.getElementsByClassName("toggle-btn")[0];

  cardDiv = createEl("div", { class: "draggable-card" });
  const headerDiv = createEl("div", { class: "card-header" });
  const titleSpan = createEl("span", {
    textContent: chrome.i18n.getMessage("panelHeader"),
  });
  const contentDiv = createEl("div", { class: "card-content" });
  headerDiv.appendChild(titleSpan);
  cardDiv.appendChild(headerDiv);
  cardDiv.appendChild(contentDiv);

  cardDiv.style.display = "none";
  // 初始弹窗位置跟随按钮且隐藏
  panelDiv.appendChild(cardDiv);

  function updatePosition(e) {
    //当移动面板时
    if (isMoved) {
      const left = Math.max(
        0,
        Math.min(window.innerWidth - panelDiv.offsetWidth, e.clientX - offsetX)
      );
      const top = Math.max(
        0,
        Math.min(
          window.innerHeight - panelDiv.offsetHeight,
          e.clientY - offsetY
        )
      );
      panelDiv.style.left = left + "px";
      panelDiv.style.top = top + "px";
      Position.left = left;
      Position.top = top;
    }
    //保证点开面板时保持在窗口内
    else {
      limitPosition();
    }
  }
  //将拖动范围限制在窗口内
  function limitPosition() {
    const panelRect = panelDiv.getBoundingClientRect();
    let newLeft = Position.left;
    let newTop = Position.top;

    if (newLeft + panelRect.width * 6 > window.innerWidth) {
      newLeft = window.innerWidth - panelRect.width * 6;
    }
    if (newLeft < 0) {
      newLeft = 0;
    }
    if (newTop + panelRect.height * 8 > window.innerHeight) {
      newTop = window.innerHeight - panelRect.height * 8;
    }
    if (newTop < 0) {
      newTop = 0;
    }
    panelDiv.style.left = newLeft + "px";
    panelDiv.style.top = newTop + "px";
    Position.left = newLeft;
    Position.top = newTop;
  }

  // 拖动逻辑
  eventManager.on(panelDiv, "mousedown", (e) => {
    isMoved = false;
    store.isDragging = true;
    //e.clientX —— 鼠标相对于视口的横坐标。
    //box.offsetLeft —— 方块相对于定位祖先的横坐标
    //二者相减得到“鼠标点击点距离方块左边框”的距离,这样拖动时按钮不会瞬间跳到鼠标位置
    ({ x: offsetX, y: offsetY } = getOffsetPos(e, panelDiv));
    //防止拖动时选中文本
    document.body.style.userSelect = "none";
    e.stopPropagation();
  });

  eventManager.on(document, "mousemove", (e) => {
    isMoved = true;
    //确保在拖动状态下才能移动

    if (store.isDragging) {
      updatePosition(e);
    }
  });

  eventManager.on(document, "mouseup", () => {
    store.isDragging = false;
    document.body.style.userSelect = ""; // 恢复文字可选中
  });

  eventManager.on(btnDiv, "click", (e) => {
    if (isMoved) return; // 确保拖动过后不弹窗

    if (!isOpen) {
      isOpen = true;
      btnDiv.classList.add("open-panel");
      cardDiv.style.display = "block";
      panelDiv.classList.add("open-panel");
      limitPosition();
      //确保面板打开后在视窗内
    } else {
      isOpen = false;
      btnDiv.classList.remove("open-panel");
      cardDiv.style.display = "none";
      panelDiv.classList.remove("open-panel");
    }
  });

  // 初始位置右下角
  const left = window.innerWidth - 80;
  const top = window.innerHeight - 80;
  panelDiv.style.left = left + "px";
  panelDiv.style.top = top + "px";
  Position.left = left;
  Position.top = top;
}

export function activateDraggablePanel() {
  DraggablePanel();

  activateScrollProgress();
  activateBookmark();
  activateCountdown();
  activateGraffiti();
  activateScreenshot();
  activateLogin();
}

export function deactivateDraggablePanel() {
  if (cardDiv) {
    cardDiv.remove();
    cardDiv = null;
  }
}
