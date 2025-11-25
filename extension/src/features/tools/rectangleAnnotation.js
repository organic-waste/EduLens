/* 创建框选注释 */
import eventStore from "../../stores/eventStore.js";
import toolStore from "../../stores/toolStore.js";
import { createEl, getId } from "../../utils/index.js";
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

let rectangleButton = null;
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
let positionUpdateRaf = null;

function getScrollOffsets() {
  return {
    x:
      typeof window.scrollX === "number"
        ? window.scrollX
        : window.pageXOffset || document.documentElement.scrollLeft || 0,
    y:
      typeof window.scrollY === "number"
        ? window.scrollY
        : window.pageYOffset || document.documentElement.scrollTop || 0,
  };
}

function getDocumentPosition(event) {
  if (event.touches && event.touches.length) {
    const touch = event.touches[0];
    return {
      x: touch.pageX,
      y: touch.pageY,
    };
  }
  const { x: scrollX, y: scrollY } = getScrollOffsets();
  return {
    x:
      typeof event.pageX === "number"
        ? event.pageX
        : event.clientX + scrollX,
    y:
      typeof event.pageY === "number"
        ? event.pageY
        : event.clientY + scrollY,
  };
}

function getViewportPosition(event) {
  if (event.touches && event.touches.length) {
    const touch = event.touches[0];
    return {
      x: touch.clientX,
      y: touch.clientY,
    };
  }
  return {
    x: event.clientX,
    y: event.clientY,
  };
}

function getEventPositions(event) {
  return {
    document: getDocumentPosition(event),
    viewport: getViewportPosition(event),
  };
}

function getPositionForRect(rect, positions) {
  return rect && rect.fixed ? positions.viewport : positions.document;
}

function applyRectPosition(rectDiv, rect) {
  rectDiv.style.left = `${rect.x}px`;
  rectDiv.style.top = `${rect.y}px`;
  rectDiv.style.position = rect.fixed ? "fixed" : "absolute";
}

function updatePreviewPosition() {
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

function updateRectanglesPosition() {
  if (!shadowRoot) return;
  rectangles.forEach((rect) => {
    const rectDiv = shadowRoot.querySelector(
      `.annotation-rect[data-id="${rect.id}"]`
    );
    if (rectDiv) {
      applyRectPosition(rectDiv, rect);
    }
  });
  updatePreviewPosition();
}

function scheduleRectanglesPositionUpdate() {
  if (positionUpdateRaf) {
    cancelAnimationFrame(positionUpdateRaf);
  }
  positionUpdateRaf = requestAnimationFrame(() => {
    positionUpdateRaf = null;
    updateRectanglesPosition();
  });
}

export function activateRectangleAnnotation() {
  shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  drawingContainer = shadowRoot.getElementById("graffiti-container");
  const toolGroupDiv = shadowRoot.querySelector(
    "#graffiti-controls .tool-group"
  );
  if (toolGroupDiv && !toolGroupDiv.querySelector("#rectangle-btn")) {
    rectangleButton = createEl("button", {
      id: "rectangle-btn",
      class: "icon-btn",
      title: chrome.i18n.getMessage("graffitiRectangle"),
      innerHTML:
        '<svg t="1758595217758" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7344" width="200" height="200"><path d="M0 837.818182l186.181818 0 0 186.181818-186.181818 0 0-186.181818Z" p-id="7345" fill="#ffffff"></path><path d="M232.727273 837.818182l558.545455 0 0 93.090909-558.545455 0 0-93.090909Z" p-id="7346" fill="#ffffff"></path><path d="M93.090909 232.727273l93.090909 0 0 558.545455-93.090909 0 0-558.545455Z" p-id="7347" fill="#ffffff"></path><path d="M0 0l186.181818 0 0 186.181818-186.181818 0 0-186.181818Z" p-id="7348" fill="#ffffff"></path><path d="M232.727273 93.090909l558.545455 0 0 93.090909-558.545455 0 0-93.090909Z" p-id="7349" fill="#ffffff"></path><path d="M837.818182 837.818182l186.181818 0 0 186.181818-186.181818 0 0-186.181818Z" p-id="7350" fill="#ffffff"></path><path d="M837.818182 0l186.181818 0 0 186.181818-186.181818 0 0-186.181818Z" p-id="7351" fill="#ffffff"></path><path d="M837.818182 232.727273l93.090909 0 0 558.545455-93.090909 0 0-558.545455Z" p-id="7352" fill="#ffffff"></path></svg>',
    });
    eventStore.on(rectangleButton, "click", toggleRectangleMode);
    eventStore.on(rectangleButton, "mousedown", (e) => e.stopPropagation());
    toolGroupDiv.appendChild(rectangleButton);
  }
  loadRectangles().then(() => {
    renderAllRectangles();
    scheduleRectanglesPositionUpdate();
  });
  setupEventListeners();
  updateDrawingContainerInteraction();

  window.__edulens_reloadRectangles = () => {
    loadRectangles().then(() => {
      //加载后记得重新渲染
      renderAllRectangles();
      scheduleRectanglesPositionUpdate();
    });
  };
}

export function clearAllRectangles() {
  const root = shadowRoot || window.__EDULENS_SHADOW_ROOT__;
  if (root && !shadowRoot) {
    shadowRoot = root;
  }
  exitEditingMode();
  rectangles = [];
  const rectEls = root
    ? root.querySelectorAll(".annotation-rect, .annotation-preview")
    : [];
  rectEls.forEach((node) => node.remove());
  scheduleRectanglesPositionUpdate();
  saveRectangles();
}

//转换矩阵模式（编辑模式/查看模式）
function toggleRectangleMode() {
  toolStore.updateState("isRectangle");
  if (toolStore.isRectangle) {
    exitEditingMode();
    updateRectanglesPointerEvents(true);
  } else {
    restorePageInteraction();
    updateRectanglesPointerEvents(false);
  }
  updateDrawingContainerInteraction();
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

function updateDrawingContainerInteraction() {
  if (!drawingContainer) return;
  if (toolStore.isRectangle || isEditing) {
    drawingContainer.style.pointerEvents = "auto";
    drawingContainer.style.cursor = toolStore.isRectangle
      ? "crosshair"
      : "default";
  } else {
    drawingContainer.style.pointerEvents = "none";
    drawingContainer.style.cursor = "";
  }
}

function setupEventListeners() {
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  eventStore.on(shadowRoot, "mousedown", listenerMouseDown);
  eventStore.on(window, "mousemove", listenerMouseMove, true);
  eventStore.on(window, "mouseup", listenerMouseUp, true);
  eventStore.on(shadowRoot, "mouseleave", listenerMouseUp);
  // 捕获阶段监听，确保 pointer-events: none 时也能记录到双击和点击
  eventStore.on(window, "dblclick", handleDblClick, true);
  eventStore.on(window, "mousedown", handleGlobalMouseDown, true);
  const syncPositions = () => scheduleRectanglesPositionUpdate();
  eventStore.on(window, "scroll", syncPositions, { passive: true });
  eventStore.on(window, "resize", syncPositions);
}

function listenerMouseDown(e) {
  if (e.button !== 0) return;
  const positions = getEventPositions(e);
  const creationPos = positions.document;

  //创建新矩阵时
  if (toolStore.isRectangle && !isEditing) {
    isCreating = true;
    startX = endX = creationPos.x;
    startY = endY = creationPos.y;
    createPreviewRectangle();
    e.preventDefault();
    e.stopPropagation();
  }
  //矩阵处于编辑态时
  else if (isEditing && currentRect) {
    const pointer = getPositionForRect(currentRect, positions);
    const { x, y } = pointer;
    
    // 通过DOM检测优先检查是否点击在文本容器或按钮上
    const textContainer = e.target.closest(".annotation-text-container");
    const deleteBtn = e.target.closest(".annotation-delete-btn");
    const pinBtn = e.target.closest(".annotation-pin-btn");
    
    if (textContainer || deleteBtn || pinBtn) {
      // 这些元素有自己的事件处理，不触发移动
      e.stopPropagation();
      return;
    }
    
    const handle = getHandleAt(x, y, currentRect);
    if (handle) {
      startResizing(handle, x, y);
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // 扩展检测区域
    const expandedMargin = 10;
    const inExpandedRect = isPointInRect(
      x,
      y,
      currentRect.x - expandedMargin,
      currentRect.y - expandedMargin,
      currentRect.width + expandedMargin * 2,
      currentRect.height + expandedMargin * 2
    );
    
    //点击到矩阵内部或扩展区域（但不是控制点）
    if (inExpandedRect) {
      //移动矩阵
      startMoving(x, y);
      e.preventDefault();
      e.stopPropagation();
    }
    //点击矩阵外部
    else {
      exitEditingMode();
      e.stopPropagation();
    }
  }
  //矩阵处于浏览态
  else if (!isEditing) {
    const clickedRect = findTopmostRectangleAt(positions);
    if (clickedRect) {
      exitEditingMode();
      e.preventDefault();
      e.stopPropagation();
    }
  }
}

function listenerMouseMove(e) {
  if (!drawingContainer) return;
  const positions = getEventPositions(e);
  const creationPos = positions.document;
  //创建矩阵元素时
  if (isCreating) {
    endX = creationPos.x;
    endY = creationPos.y;
    updatePreviewRectangle();
  }
  //编辑矩阵时
  else if (isEditing && currentRect) {
    const pointer = getPositionForRect(currentRect, positions);
    const { x, y } = pointer;
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
      } else {
        // 扩展检测区域
        const expandedMargin = 10;
        const inExpandedRect = isPointInRect(
          x,
          y,
          currentRect.x - expandedMargin,
          currentRect.y - expandedMargin,
          currentRect.width + expandedMargin * 2,
          currentRect.height + expandedMargin * 2
        );
        
        if (inExpandedRect) {
          drawingContainer.style.cursor = "move";
        } else {
          drawingContainer.style.cursor = "default";
        }
      }
    }
  }
  //查看元素时
  else if (!toolStore.isRectangle && !isEditing) {
    const hoveredRect = findTopmostRectangleAt(positions);
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
  if (!drawingContainer) return;
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
      fixed: false,
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
  updateDrawingContainerInteraction();
  restorePageInteraction();
}

function handleDblClick(e) {
  if (toolStore.isRectangle || isEditing) return;
  if (!drawingContainer) return;

  const containerRect = drawingContainer.getBoundingClientRect();
  const insideContainer =
    e.clientX >= containerRect.left &&
    e.clientX <= containerRect.right &&
    e.clientY >= containerRect.top &&
    e.clientY <= containerRect.bottom;
  if (!insideContainer) return;

  const positions = getEventPositions(e);
  const clickedRect = findTopmostRectangleAt(positions);
  if (clickedRect) {
    enterEditingMode(clickedRect);
    e.preventDefault();
    e.stopPropagation();
  }
}

function handleGlobalMouseDown(e) {
  if (!isEditing || toolStore.isRectangle || !drawingContainer || !currentRect)
    return;

  const rectDiv = shadowRoot.querySelector(
    `.annotation-rect[data-id="${currentRect.id}"]`
  );
  if (rectDiv && rectDiv.contains(e.target)) return;

  const containerRect = drawingContainer.getBoundingClientRect();
  const insideContainer =
    e.clientX >= containerRect.left &&
    e.clientX <= containerRect.right &&
    e.clientY >= containerRect.top &&
    e.clientY <= containerRect.bottom;

  if (!insideContainer) {
    exitEditingMode();
    return;
  }

  const positions = getEventPositions(e);
  const pointer = getPositionForRect(currentRect, positions);
  const { x, y } = pointer;
  
  // 扩展检测区域（控制点半径+margin）
  const expandedMargin = 15;
  if (
    !isPointInRect(
      x,
      y,
      currentRect.x - expandedMargin,
      currentRect.y - expandedMargin,
      currentRect.width + expandedMargin * 2,
      currentRect.height + expandedMargin * 2
    )
  ) {
    exitEditingMode();
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
  scheduleRectanglesPositionUpdate();
}

function renderRectangles(rect) {
  rect.fixed = Boolean(rect.fixed);
  const rectDiv = createEl("div", {
    class: "annotation-rect",
    "data-id": rect.id,
    style: `width:${rect.width}px;height:${rect.height}px;border-color:${
      rect.color
    };pointer-events:${toolStore.isRectangle ? "auto" : "none"};`,
  });
  rectDiv.dataset.id = rect.id;
  applyRectPosition(rectDiv, rect);

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
  const pinBtn = createEl("button", {
    class: "annotation-pin-btn icon-btn",
    title: chrome.i18n.getMessage("imagePinToggle"),
    innerHTML: getPinIcon(rect.fixed),
  });

  textContainer.append(textInput, pinBtn, deleteBtn);

  const tooltip = createEl("div", {
    class: "annotation-tooltip",
    textContent: rect.text,
    style: `color:${rect.color};`,
  });
  if (rect.text.trim() !== "") {
    tooltip.style.display = "block";
  } else {
    tooltip.style.display = "none";
  }
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
  eventStore.on(pinBtn, "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleRectanglePin(rect, rectDiv, pinBtn);
  });
  eventStore.on(pinBtn, "mousedown", (e) => e.stopPropagation());
  drawingContainer.appendChild(rectDiv);
  scheduleRectanglesPositionUpdate();
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
  updateDrawingContainerInteraction();

  const rectDiv = shadowRoot.querySelector(
    `.annotation-rect[data-id="${rect.id}"]`
  );
  if (!rectDiv) return;
  rectDiv.classList.add("editing");
  rectDiv.style.pointerEvents = "auto";

  const textContainer = rectDiv.querySelector(".annotation-text-container");
  const textInput = rectDiv.querySelector(".annotation-text-input");
  const tooltip = rectDiv.querySelector(".annotation-tooltip");

  textContainer.style.display = "flex";
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
  updateDrawingContainerInteraction();
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
    handle.style.cursor = getCursorForHandle({ type: h.type });
    eventStore.on(handle, "mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const positions = getEventPositions(e);
      const pointer = getPositionForRect(rect, positions);
      const { x, y } = pointer;
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
  const { x: scrollX, y: scrollY } = getScrollOffsets();
  
  // 扩展控制点的检测区域，增加5px的容差
  const handleMargin = 5;
  
  for (let handle of handles) {
    const handleRect = handle.getBoundingClientRect();
    const handleX = handleRect.left + (rect.fixed ? 0 : scrollX);
    const handleY = handleRect.top + (rect.fixed ? 0 : scrollY);
    const handleW = handleRect.width;
    const handleH = handleRect.height;
    
    // 扩展检测区域
    if (isPointInRect(
      x, 
      y, 
      handleX - handleMargin, 
      handleY - handleMargin, 
      handleW + handleMargin * 2, 
      handleH + handleMargin * 2
    )) {
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
    applyRectPosition(rectDiv, currentRect);
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
    applyRectPosition(rectDiv, currentRect);
  }
}

/* 工具函数 */

function isPointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

function findTopmostRectangleAt(positions) {
  for (let i = rectangles.length - 1; i >= 0; i--) {
    const rect = rectangles[i];
    const pointer = getPositionForRect(rect, positions);
    const { x, y } = pointer;
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
      tooltip.style.display = "block";
      tooltip.style.opacity = 1;
    }
  }
}

function hideTooltip(rectId) {
  // 保持提示文本常驻显示，不再隐藏
  showTooltip(rectId);
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
    const stored = await storageManager.getPageDataByType("rectangles");
    rectangles = Array.isArray(stored)
      ? stored.map((rect) => ({
          ...rect,
          fixed: Boolean(rect.fixed),
        }))
      : [];
  } catch (error) {
    console.error(error);
    rectangles = [];
  }
}

function getPinIcon(isFixed) {
  return isFixed
    ? '<svg t="1759978122492" class="icon" viewBox="0 -100 1074 1074" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1768" width="200" height="200"><path d="M697.464355 375.861272l-20.716763-208.154143h73.988439q16.770713 0 29.102119-12.331406T792.169557 126.273603V41.433526q0-16.770713-12.331407-29.102119T750.736031 0H273.263969q-16.770713 0-29.102119 12.331407T231.830443 41.433526v84.840077q0 16.770713 12.331407 29.10212T273.263969 167.707129h73.988439l-20.716763 208.154143q-68.069364 30.581888-107.529865 80.894027-43.406551 54.258189-43.406551 118.381503 0 17.757225 12.331407 30.088632T217.032755 617.55684h238.736031v181.518305q0 3.94605 1.973025 6.905587l41.433526 83.853565q3.94605 7.8921 12.824663 7.8921t12.824663-7.8921l41.433526-83.853565q1.973025-2.959538 1.973025-6.905587V617.55684h238.736031q16.770713 0 29.102119-12.331406T848.400771 575.136802q0-64.123314-43.406551-118.381503-40.447013-50.312139-107.529865-80.894027z" p-id="1769" fill="white"></path></svg>'
    : '<svg t="1759978010518" class="icon" viewBox="-70 -100 1214 1214" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1559" width="200" height="200"><path d="M741 373.2l-11.4-85.2H784c26.4 0 48-21.6 48-48V48c0-26.4-21.6-48-48-48H240C213.6 0 192 21.6 192 48v192c0 26.4 21.6 48 48 48h54.4l-11.4 85.2C187.2 438.8 128 541.4 128 656c0 26.4 21.6 48 48 48h288v208c0 1.8 0.2 3.4 0.8 5l32 96c4.8 14.6 25.6 14.6 30.4 0l32-96c0.6-1.6 0.8-3.4 0.8-5V704h288c26.4 0 48-21.6 48-48 0-114.6-59.2-217.2-155-282.8zM229 608c16.6-77 71.2-140 143-175.6L404 192H288V96h448v96h-116l32 240.4c71.6 35.6 126.4 98.8 143 175.6z" p-id="1560" fill="white"></path></svg>';
}

function toggleRectanglePin(rect, rectDiv, pinBtn) {
  const { x: scrollX, y: scrollY } = getScrollOffsets();
  if (rect.fixed) {
    rect.x += scrollX;
    rect.y += scrollY;
  } else {
    rect.x -= scrollX;
    rect.y -= scrollY;
  }
  rect.fixed = !rect.fixed;
  applyRectPosition(rectDiv, rect);
  pinBtn.innerHTML = getPinIcon(rect.fixed);
  saveRectangles();
}
