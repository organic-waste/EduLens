/* 创建框选注释 */
import eventStore from "../../stores/eventStore.js";
import toolStore from "../../stores/toolStore.js";
import { getOffsetPos, createEl, getId } from "../../utils/index.js";
import { storageManager, syncManager } from "../../services/index.js";
import {
  preventPageInteraction,
  restorePageInteraction,
} from "../../utils/index.js";

let isCreating = false; //是否还在创建矩阵中
let isEditing = false; //是否有矩阵处于编辑模式
let editingRect = null;
let startX, startY, endX, endY;
// let hoverTimeout = null;
// let hoverRectId = null;

let drawingContainer = null;
let previewDiv = null;
let currentRect = null;

let rectangles = [];

// 框选操作相关变量
let isResizing = false;
let isMoving = false;
let resizeHandle = null;
let moveStartX = 0;
let moveStartY = 0;
let originalRect = null;
let originalRectPos = null;
let shadowRoot = null;

export function activateRectangleAnnotation() {
  shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  drawingContainer = shadowRoot.getElementById("graffiti-container");
  loadRectangles().then(() => {
    renderAllRectangles();
  });
  setupEventListeners();

  window.__edulens_reloadRectangles = () => {
    loadRectangles().then(() => {
      //加载后记得重新渲染
      renderAllRectangles();
    });
  };
}

//转换矩阵模式（编辑模式/查看模式）
export function toggleRectangleMode() {
  toolStore.updateState("isRectangle");
  if (toolStore.isRectangle) {
    drawingContainer.style.pointerEvents = "auto";
    drawingContainer.style.cursor = "crosshair";
    exitEditingMode();
    updateRectanglesPointerEvents(true);
  } else {
    drawingContainer.style.pointerEvents = "none";
    drawingContainer.style.cursor = "";
    restorePageInteraction();
    updateRectanglesPointerEvents(false);
  }
}

//控制框选的悬停鼠标样式
function updateRectanglesPointerEvents(enable) {
  const allRects = drawingContainer.querySelectorAll(".annotation-rect");
  allRects.forEach((rect) => {
    if (enable || isEditing) {
      rect.style.pointerEvents = "auto";
    } else {
      rect.style.pointerEvents = "none";
    }
  });
}

function setupEventListeners() {
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  eventStore.on(shadowRoot, "mousedown", listenerMouseDown);
  eventStore.on(shadowRoot, "mousemove", listenerMouseMove);
  eventStore.on(shadowRoot, "mouseup", listenerMouseUp);
  eventStore.on(shadowRoot, "mouseleave", listenerMouseUp);
  eventStore.on(shadowRoot, "dblclick", handleDblClick);
}

function listenerMouseDown(e) {
  if (e.button !== 0) return;
  const { x, y } = getOffsetPos(e, drawingContainer);

  //创建新矩阵时
  if (toolStore.isRectangle && !isEditing) {
    isCreating = true;
    startX = endX = x;
    startY = endY = y;
    createPreviewRectangle();
    e.preventDefault();
    e.stopPropagation();
  }
  //矩阵处于编辑态时
  else if (isEditing && currentRect) {
    //点击到矩阵内部
    if (
      isPointInRect(
        x,
        y,
        currentRect.x,
        currentRect.y,
        currentRect.width,
        currentRect.height
      )
    ) {
      const textContainer = e.target.closest(".annotation-text-container");
      const deleteBtn = e.target.closest(".annotation-delete-btn");
      if (textContainer || deleteBtn) {
        //保证点击在文本和删除按钮上时不触发矩阵的移动
        e.stopPropagation();
        return;
      }
      //移动矩阵
      startMoving(x, y);
      e.preventDefault();
      e.stopPropagation();
    }
    //点击矩阵外部
    else {
      // console.log("点击到矩阵外部");
      exitEditingMode();
      e.stopPropagation();
    }
  }
  //矩阵处于浏览态
  else if (!isEditing) {
    const clickedRect = findTopmostRectangleAt(x, y);
    if (clickedRect) {
      exitEditingMode();
      e.preventDefault();
      e.stopPropagation();
    }
  }
}

function listenerMouseMove(e) {
  const { x, y } = getOffsetPos(e, drawingContainer);
  //创建矩阵元素时
  if (isCreating) {
    endX = x;
    endY = y;
    updatePreviewRectangle();
  }
  //编辑矩阵时
  else if (isEditing && currentRect) {
    if (isResizing) {
      doResize(x, y);
      e.preventDefault();
    } else if (isMoving) {
      doMove(x, y);
      e.preventDefault();
    } else {
      const handle = getHandleAt(x, y, currentRect);
      //通过判断鼠标位置来获取到对应的cursor样式
      if (handle) {
        drawingContainer.style.cursor = getCursorForHandle(handle);
      } else if (
        isPointInRect(
          x,
          y,
          currentRect.x,
          currentRect.y,
          currentRect.width,
          currentRect.height
        )
      ) {
        drawingContainer.style.cursor = "move";
      } else {
        drawingContainer.style.cursor = "default";
      }
    }
  }
  //查看元素时
  else if (!toolStore.isRectangle && !isEditing) {
    const hoveredRect = findTopmostRectangleAt(x, y);
    const hoveredRectId = hoveredRect?.id;
    // 当鼠标下方没有有效矩阵时
    if (!hoveredRect) {
      if (toolStore.currentHoveredRectId) {
        if (toolStore.hoverTimeout) {
          clearTimeout(toolStore.hoverTimeout);
        }
        hideTooltip(toolStore.currentHoveredRectId);
        toolStore.currentHoveredRectId = null;
      }
      return;
    }

    // 当转移hover的元素时
    if (hoveredRectId && hoveredRectId !== toolStore.currentHoveredRectId) {
      if (toolStore.hoverTimeout) {
        clearTimeout(toolStore.hoverTimeout);
      }
      toolStore.currentHoveredRectId = hoveredRectId;
      toolStore.hoverTimeout = setTimeout(() => {
        showTooltip(hoveredRectId);
      }, 200);
    }
  }
}

function listenerMouseUp() {
  if (isCreating) {
    isCreating = false;
    const newRect = {
      id: getId(),
      x: Math.min(startX, endX),
      y: Math.min(startY, endY),
      width: Math.abs(endX - startX),
      height: Math.abs(endY - startY),
      text: "",
      color: toolStore.currentColor,
    };
    //排除太小的矩阵
    if (newRect.width > 5 && newRect.height > 5) {
      //绘制出具体的实现矩阵
      rectangles.push(newRect);
      renderRectangles(newRect);
      saveRectangles();
    }
    removePreviewRectangle();
    //转为查看模式
    toggleRectangleMode();
  }
  //恢复其他操作
  isResizing = false;
  isMoving = false;
  drawingContainer.style.cursor = toolStore.isRectangle
    ? "crosshair"
    : "default";
  restorePageInteraction();
}

function handleDblClick(e) {
  if (toolStore.isRectangle || isEditing) return;
  const { x, y } = getOffsetPos(e, drawingContainer);

  const clickedRect = findTopmostRectangleAt(x, y);
  if (clickedRect) {
    enterEditingMode(clickedRect);
    e.preventDefault();
    e.stopPropagation();
  }
}

function createPreviewRectangle() {
  if (previewDiv) removePreviewRectangle();
  previewDiv = createEl("div", {
    class: "annotation-preview",
    style: `border-color:${toolStore.currentColor};border-width: ${toolStore.brushSize}px`,
  });
  drawingContainer.appendChild(previewDiv);
}

function updatePreviewRectangle() {
  if (!previewDiv) return;
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  previewDiv.style.left = `${left}px`;
  previewDiv.style.top = `${top}px`;
  previewDiv.style.width = `${width}px`;
  previewDiv.style.height = `${height}px`;
}

function removePreviewRectangle() {
  if (previewDiv && previewDiv.parentNode) {
    previewDiv.parentNode.removeChild(previewDiv);
  }
  previewDiv = null;
}

function renderAllRectangles() {
  drawingContainer
    .querySelectorAll(".annotation-rect")
    .forEach((e) => e.remove());
  rectangles.forEach((r) => renderRectangles(r));
}

function renderRectangles(rect) {
  const rectDiv = createEl("div", {
    class: "annotation-rect",
    "data-id": rect.id,
    style: `left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${
      rect.height
    }px;border-color:${rect.color};pointer-events:${
      toolStore.isRectangle ? "auto" : "none"
    };`,
  });
  rectDiv.dataset.id = rect.id;

  const textContainer = createEl("div", { class: "annotation-text-container" });
  const textInput = createEl("input", {
    type: "text",
    class: "annotation-text-input",
    id: `annotation-input-${rect.id}`,
    name: `annotation-text-${rect.id}`,
    value: rect.text,
    style: "display:none;",
    placeholder: chrome.i18n.getMessage("rectangleInput"),
  });
  const deleteBtn = createEl("button", {
    class: "annotation-delete-btn delete-button",
    textContent: "×",
    title: chrome.i18n.getMessage("rectangleDelete"),
  });

  textContainer.append(textInput, deleteBtn);

  const tooltip = createEl("div", {
    class: "annotation-tooltip",
    textContent: rect.text,
    style: `color:${toolStore.currentColor};`,
  });
  rectDiv.append(textContainer, tooltip);

  eventStore.on(textInput, "input", (e) => {
    rect.text = e.target.value;
    tooltip.textContent = e.target.value;
    saveRectangles();
  });
  eventStore.on(textInput, "mousedown", (e) => e.stopPropagation());
  eventStore.on(textInput, "click", (e) => e.stopPropagation());

  eventStore.on(deleteBtn, "click", (e) => {
    e.stopPropagation();
    removeRectangle(rect.id);
  });
  eventStore.on(deleteBtn, "mousedown", (e) => e.stopPropagation());
  drawingContainer.appendChild(rectDiv);
}

function removeRectangle(id) {
  rectangles = rectangles.filter((r) => r.id !== id);
  const rectDiv = shadowRoot.querySelector(`.annotation-rect[data-id="${id}"]`);
  if (rectDiv) rectDiv.remove();
  // 如果删除的是当前编辑的框选，则退出编辑模式
  if (editingRect && currentRect && currentRect.id === id) {
    exitEditingMode();
  }
  saveRectangles();
}

//进入创建矩阵模式
function enterEditingMode(rect) {
  //已经在编辑这个矩阵时
  if (isEditing && editingRect && currentRect && currentRect.id === rect.id)
    return;

  exitEditingMode();
  isEditing = true;
  editingRect = rect;
  currentRect = rect;

  const rectDiv = shadowRoot.querySelector(
    `.annotation-rect[data-id="${rect.id}"]`
  );
  if (!rectDiv) return;
  rectDiv.classList.add("editing");
  rectDiv.style.pointerEvents = "auto";

  const textContainer = rectDiv.querySelector(".annotation-text-container");
  const textInput = rectDiv.querySelector(".annotation-text-input");
  const tooltip = rectDiv.querySelector(".annotation-tooltip");

  textContainer.style.display = "block";
  textInput.style.display = "block";
  tooltip.style.display = "none";
  textInput.focus();
  textInput.select(); //全选方便编辑
  createHandles(rectDiv, rect);
}

//退出创建矩阵模式
function exitEditingMode() {
  if (!isEditing) return;
  isEditing = false;
  if (currentRect) {
    const rectDiv = shadowRoot.querySelector(
      `.annotation-rect[data-id="${currentRect.id}"]`
    );
    if (rectDiv) {
      rectDiv.classList.remove("editing");
      rectDiv.style.pointerEvents = toolStore.isRectangle ? "auto" : "none";
      const textContainer = rectDiv.querySelector(".annotation-text-container");
      const textInput = rectDiv.querySelector(".annotation-text-input");
      const tooltip = rectDiv.querySelector(".annotation-tooltip");

      textContainer.style.display = "none";
      textInput.style.display = "none";

      //有文本的时候才显示tooltip
      if (currentRect.text.trim() !== "") {
        tooltip.textContent = currentRect.text;
        tooltip.style.display = "block";
      } else {
        tooltip.style.display = "none";
      }

      shadowRoot.querySelectorAll(".resize-handle").forEach((h) => h.remove());
    }
  }
  editingRect = null;
  currentRect = null;
  drawingContainer.style.cursor = "default";
}

function createHandles(rectDiv, rect) {
  const handles = [
    { type: "nw", x: -5, y: -5 },
    { type: "n", x: rect.width / 2 - 5, y: -5 },
    { type: "ne", x: rect.width - 5, y: -5 },
    { type: "e", x: rect.width - 5, y: rect.height / 2 - 5 },
    { type: "se", x: rect.width - 5, y: rect.height - 5 },
    { type: "s", x: rect.width / 2 - 5, y: rect.height - 5 },
    { type: "sw", x: -5, y: rect.height - 5 },
    { type: "w", x: -5, y: rect.height / 2 - 5 },
  ];
  handles.forEach((h) => {
    const handle = document.createElement("div");
    handle.className = "resize-handle";
    handle.dataset.type = h.type;
    handle.style.left = `${h.x}px`;
    handle.style.top = `${h.y}px`;
    eventStore.on(handle, "mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      //获取container位置转为获取canvas的位置
      const { x, y } = getOffsetPos(e, drawingContainer);
      startResizing({ element: handle, type: handle.dataset.type }, x, y);
    });
    rectDiv.appendChild(handle);
  });
}

function getHandleAt(x, y, rect) {
  const rectDiv = shadowRoot.querySelector(
    `.annotation-rect[data-id="${rect.id}"]`
  );
  if (!rectDiv) return null;
  const handles = rectDiv.getElementsByClassName("resize-handle");
  for (let handle of handles) {
    const handleRect = handle.getBoundingClientRect();
    const containerRect = drawingContainer.getBoundingClientRect();
    const handleX = handleRect.left - containerRect.left;
    const handleY = handleRect.top - containerRect.top;
    const handleW = handleRect.width;
    const handleH = handleRect.height;
    if (isPointInRect(x, y, handleX, handleY, handleW, handleH)) {
      return {
        element: handle,
        type: handle.dataset.type,
      };
    }
  }
  return null;
}

function getCursorForHandle(handle) {
  const cursorMap = {
    nw: "nw-resize",
    n: "n-resize",
    ne: "ne-resize",
    e: "e-resize",
    se: "se-resize",
    s: "s-resize",
    sw: "sw-resize",
    w: "w-resize",
  };
  return cursorMap[handle.type] || "default";
}

function startResizing(handle, x, y) {
  isResizing = true;
  resizeHandle = handle;
  moveStartX = x;
  moveStartY = y;
  originalRect = {
    x: currentRect.x,
    y: currentRect.y,
    width: currentRect.width,
    height: currentRect.height,
  };
  preventPageInteraction();
}

function doResize(currentX, currentY) {
  if (!isResizing || !resizeHandle || !originalRect) return;
  const dx = currentX - moveStartX;
  const dy = currentY - moveStartY;
  const orig = originalRect;
  let newX = orig.x;
  let newY = orig.y;
  let newW = orig.width;
  let newH = orig.height;

  switch (resizeHandle.type) {
    case "nw":
      newX = orig.x + dx;
      newY = orig.y + dy;
      newW = orig.width - dx;
      newH = orig.height - dy;
      break;
    case "n":
      newY = orig.y + dy;
      newH = orig.height - dy;
      break;
    case "ne":
      newY = orig.y + dy;
      newW = orig.width + dx;
      newH = orig.height - dy;
      break;
    case "e":
      newW = orig.width + dx;
      break;
    case "se":
      newW = orig.width + dx;
      newH = orig.height + dy;
      break;
    case "s":
      newH = orig.height + dy;
      break;
    case "sw":
      newX = orig.x + dx;
      newW = orig.width - dx;
      newH = orig.height + dy;
      break;
    case "w":
      newX = orig.x + dx;
      newW = orig.width - dx;
      break;
  }

  //最小尺寸（否则放不下控制点了）
  const minWidth = 10;
  const minHeight = 10;
  if (newW < minWidth) {
    newW = minWidth;
    //调整向左拉
    if (resizeHandle.type.includes("w")) newX = orig.x + orig.width - minWidth;
  }
  if (newH < minHeight) {
    newH = minHeight;
    //调整向上拉
    if (resizeHandle.type.includes("n"))
      newY = orig.y + orig.height - minHeight;
  }

  currentRect.x = newX;
  currentRect.y = newY;
  currentRect.width = newW;
  currentRect.height = newH;

  const rectDiv = shadowRoot.querySelector(
    `.annotation-rect[data-id="${currentRect.id}"]`
  );
  if (rectDiv) {
    rectDiv.style.left = `${newX}px`;
    rectDiv.style.top = `${newY}px`;
    rectDiv.style.width = `${newW}px`;
    rectDiv.style.height = `${newH}px`;

    const handles = rectDiv.querySelectorAll(".resize-handle");
    handles.forEach((h) => {
      let hx, hy;
      switch (h.dataset.type) {
        case "nw":
          hx = -5;
          hy = -5;
          break;
        case "n":
          hx = newW / 2 - 5;
          hy = -5;
          break;
        case "ne":
          hx = newW - 5;
          hy = -5;
          break;
        case "e":
          hx = newW - 5;
          hy = newH / 2 - 5;
          break;
        case "se":
          hx = newW - 5;
          hy = newH - 5;
          break;
        case "s":
          hx = newW / 2 - 5;
          hy = newH - 5;
          break;
        case "sw":
          hx = -5;
          hy = newH - 5;
          break;
        case "w":
          hx = -5;
          hy = newH / 2 - 5;
          break;
      }
      h.style.left = `${hx}px`;
      h.style.top = `${hy}px`;
    });
  }
}

function startMoving(startX, startY) {
  isMoving = true;
  moveStartX = startX;
  moveStartY = startY;
  originalRectPos = { x: currentRect.x, y: currentRect.y };
  preventPageInteraction();
}

function doMove(currentX, currentY) {
  if (!isMoving || !originalRectPos) return;
  const dx = currentX - moveStartX;
  const dy = currentY - moveStartY;
  const newX = originalRectPos.x + dx;
  const newY = originalRectPos.y + dy;

  currentRect.x = newX;
  currentRect.y = newY;

  const rectDiv = shadowRoot.querySelector(
    `.annotation-rect[data-id="${currentRect.id}"]`
  );
  if (rectDiv) {
    rectDiv.style.left = `${newX}px`;
    rectDiv.style.top = `${newY}px`;
  }
}

/* 工具函数 */

function isPointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

function findTopmostRectangleAt(x, y) {
  for (let i = rectangles.length - 1; i >= 0; i--) {
    const rect = rectangles[i];
    if (isPointInRect(x, y, rect.x, rect.y, rect.width, rect.height)) {
      return rect;
    }
  }
}

function showTooltip(rectId) {
  const rectDiv = shadowRoot.querySelector(
    `.annotation-rect[data-id="${rectId}"]`
  );
  const rect = rectangles.find((r) => r.id === rectId);
  if (rect && rect.text.trim() !== "" && rectDiv) {
    const tooltip = rectDiv.querySelector(".annotation-tooltip");
    if (tooltip) {
      tooltip.textContent = rect.text;
      tooltip.style.opacity = 1;
    }
  }
}

function hideTooltip(rectId) {
  const rectDiv = shadowRoot.querySelector(
    `.annotation-rect[data-id="${rectId}"]`
  );
  if (rectDiv) {
    const tooltip = rectDiv.querySelector(".annotation-tooltip");
    if (tooltip) {
      tooltip.style.opacity = 0;
    }
  }
}

/* 持久化 */

async function saveRectangles() {
  try {
    await storageManager.savePageData("rectangles", rectangles);

    // 发送实时同步操作 - 同步所有框选数据
    syncManager.sendOperation({
      type: "rectangle-update",
      data: rectangles,
    });
  } catch (error) {
    console.error(error);
  }
}

async function loadRectangles() {
  try {
    rectangles = await storageManager.getPageDataByType("rectangles");
  } catch (error) {
    console.error(error);
    rectangles = [];
  }
}
