/* 创建涂鸦 */
import eventStore from "../../stores/eventStore.js";
import toolStore from "../../stores/toolStore.js";
import { MonitorSPARoutes } from "../../utils/index.js";
import { getOffsetPos, createEl } from "../../utils/index.js";
import { storageManager, syncManager } from "../../services/index.js";
import { activateRectangleAnnotation } from "./rectangleAnnotation.js";
import { activateImageAnnotation } from "./uploadImage.js";

let drawingCanvas = null;
let drawingCtx = null;
let drawingContainer = null;
let startX = 0;
let startY = 0;
let imageData = null;
let isInitialized = false;

function createDrawingCanvas() {
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  drawingContainer = shadowRoot.getElementById("graffiti-container");
  if (!drawingContainer) {
    drawingContainer = createEl("div", { id: "graffiti-container" });
    shadowRoot.appendChild(drawingContainer);
  }
  drawingCanvas = shadowRoot.getElementById("graffiti-canvas");
  if (!drawingCanvas) {
    drawingCanvas = createEl("canvas", {
      id: "graffiti-canvas",
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    });
    drawingContainer.appendChild(drawingCanvas);
  }
  drawingCtx = drawingCanvas.getContext("2d", { willReadFrequently: true });
  setupCanvasContext();
}

function setupCanvasContext() {
  if (!drawingCtx) return;
  drawingCtx.lineCap = "round";
  drawingCtx.lineJoin = "round";
  drawingCtx.strokeStyle = toolStore.currentColor;
}

function resizeCanvas() {
  if (!drawingCanvas || !drawingCtx) return;
  const newWidth = Math.max(
    document.documentElement.scrollWidth,
    window.innerWidth
  );
  const newHeight = Math.max(
    document.documentElement.scrollHeight,
    window.innerHeight
  );
  if (drawingCanvas.width === newWidth && drawingCanvas.height === newHeight) {
    return;
  }
  try {
    imageData = drawingCtx.getImageData(
      0,
      0,
      drawingCanvas.width,
      drawingCanvas.height
    );
  } catch (error) {
    imageData = null;
  }
  drawingCanvas.width = newWidth;
  drawingCanvas.height = newHeight;
  drawingContainer.style.width = `${newWidth}px`;

  setupCanvasContext();
  if (imageData) {
    drawingCtx.putImageData(imageData, 0, 0);
  }
}

function updateMode(mode) {
  switch (mode) {
    case "pen":
      toolStore.updateState("isPen");
      if (drawingCtx) {
        drawingCtx.globalCompositeOperation = "source-over";
        drawingCtx.strokeStyle = toolStore.currentColor;
      }
      break;
    case "eraser":
      toolStore.updateState("isEraser");
      if (drawingCtx) {
        drawingCtx.globalCompositeOperation = "destination-out";
        drawingCtx.strokeStyle = "rgba(0,0,0,1)";
      }
      break;
    case "line":
      toolStore.updateState("isLine");
      if (drawingCtx) {
        drawingCtx.globalCompositeOperation = "source-over";
        drawingCtx.strokeStyle = toolStore.currentColor;
      }
      break;
    default:
      toolStore.updateState();
      if (drawingCtx) {
        drawingCtx.globalCompositeOperation = "source-over";
        drawingCtx.strokeStyle = toolStore.currentColor;
      }
      break;
  }
}

function setupEventListeners() {
  if (isInitialized) return;
  isInitialized = true;

  eventStore.on(document, "mousedown", startDrawing);
  eventStore.on(document, "mousemove", draw);
  eventStore.on(document, "mouseup", stopDrawing);
  eventStore.on(document, "mouseleave", stopDrawing);

  let resizeTimeout = null;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => resizeCanvas(), 100);
  };
  eventStore.on(window, "resize", handleResize);
}

function startDrawing(e) {
  if (toolStore.isDragging || e.button !== 0) return;
  if (!toolStore.isEraser && !toolStore.isPen && !toolStore.isLine) return;

  toolStore.isDrawing = true;
  drawingContainer.style.pointerEvents = "auto";
  ({ x: startX, y: startY } = getOffsetPos(e, drawingCanvas));

  if (toolStore.isLine) {
    imageData = drawingCtx.getImageData(
      0,
      0,
      drawingCanvas.width,
      drawingCanvas.height
    );
  }
  drawingCtx.beginPath();
  drawingCtx.moveTo(startX, startY);
  draw(e);
}

function draw(e) {
  if (!toolStore.isDrawing || !drawingCtx || toolStore.isDragging) return;
  if (!toolStore.isEraser && !toolStore.isPen && !toolStore.isLine) return;
  const { x, y } = getOffsetPos(e, drawingCanvas);

  drawingCtx.lineWidth = toolStore.isEraser
    ? toolStore.eraserBrushSize
    : toolStore.penBrushSize;

  if (!toolStore.isLine) {
    drawingCtx.lineTo(x, y);
    drawingCtx.stroke();
    drawingCtx.beginPath();
    drawingCtx.moveTo(x, y);
  } else if (imageData) {
    drawingCtx.putImageData(imageData, 0, 0);
    drawingCtx.beginPath();
    drawingCtx.moveTo(startX, startY);
    drawingCtx.lineTo(x, y);
    drawingCtx.stroke();
  }
}

function stopDrawing(e) {
  if (toolStore.isDragging) return;
  if (!toolStore.isDrawing) return;
  if (!toolStore.isEraser && !toolStore.isPen && !toolStore.isLine) return;

  toolStore.isDrawing = false;
  drawingContainer.style.pointerEvents = "none";

  const { x, y } = getOffsetPos(e, drawingCanvas);
  drawingCtx.lineTo(x, y);
  drawingCtx.stroke();
  drawingCtx.beginPath();

  saveDrawing();
}

function clearCanvas() {
  if (!drawingCtx || !drawingCanvas) return;
  drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  saveDrawing();
}

async function saveDrawing() {
  if (!drawingCanvas) return;
  try {
    const dataURL = drawingCanvas.toDataURL("image/png");
    syncManager.sendOperation({
      type: "canvas-update",
      data: dataURL,
    });
  } catch (error) {
    console.error(error);
  }
}

async function loadDrawing() {
  if (!drawingCtx || !drawingCanvas) return;
  try {
    const dataURL = await storageManager.getPageDataByType("canvas");
    if (!dataURL) return;
    const img = new Image();
    img.onload = () => {
      drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      drawingCtx.drawImage(img, 0, 0);
    };
    img.onerror = (error) => console.error(error);
    img.src = dataURL;
  } catch (error) {
    console.error(error);
  }
}

async function handlePageChange() {
  await saveDrawing();
  resizeCanvas();
  await loadDrawing();
}

export function activateGraffiti() {
  createDrawingCanvas();
  loadDrawing();
  setupEventListeners();

  activateRectangleAnnotation();
  activateImageAnnotation();

  MonitorSPARoutes(handlePageChange);

  window.__edulens_reloadCanvas = () => {
    loadDrawing();
  };
}

export function setGraffitiMode(mode) {
  updateMode(mode);
}

export function setGraffitiColor(color) {
  toolStore.currentColor = color;
  if (drawingCtx && (toolStore.isPen || toolStore.isLine)) {
    drawingCtx.strokeStyle = color;
  }
}

export function setPenBrushSize(size) {
  const value = Math.max(1, Math.min(100, Number(size) || toolStore.penBrushSize));
  toolStore.penBrushSize = value;
}

export function setEraserBrushSize(size) {
  const value = Math.max(1, Math.min(200, Number(size) || toolStore.eraserBrushSize));
  toolStore.eraserBrushSize = value;
}

export function clearGraffitiCanvas() {
  clearCanvas();
}

export function getGraffitiState() {
  let mode = "idle";
  if (toolStore.isPen) mode = "pen";
  else if (toolStore.isEraser) mode = "eraser";
  else if (toolStore.isLine) mode = "line";

  return {
    mode,
    color: toolStore.currentColor,
    penBrushSize: toolStore.penBrushSize,
    eraserBrushSize: toolStore.eraserBrushSize,
  };
}
