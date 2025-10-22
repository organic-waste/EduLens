// 创建涂鸦
import eventStore from "../../stores/eventStore.js";
import toolStore from "../../stores/toolStore.js";
import { MonitorSPARoutes } from "../../utils/index.js";
import { getOffsetPos, createEl } from "../../utils/index.js";
import {
  getPageDataByType,
  savePageData,
} from "../../services/index.js";
import { activateRectangleAnnotation } from "./rectangleAnnotation.js";
import { activateImageAnnotation } from "./uploadImage.js";
import { cloudSync } from "../../services/index.js";

let drawingCanvas = null;
let drawingCtx = null;
let drawingContainer = null;
let colorPickerInput = null;
let brushSizeSlider = null;
let brushSizeValueDisplay = null;
let clearButton = null;
let lineButton = null;
let eraserButton = null;
let penButton = null;
let graffitiControlsDiv = null;
let startX = 0;
let startY = 0;
let imageData = null;

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
    drawingCtx = drawingCanvas.getContext("2d", { willReadFrequently: true });
    setupCanvasContext();
  } else {
    drawingCtx = drawingCanvas.getContext("2d", { willReadFrequently: true });
    setupCanvasContext();
    resizeCanvas();
  }
}

function setupCanvasContext() {
  if (drawingCtx) {
    drawingCtx.lineCap = "round";
    drawingCtx.lineJoin = "round";
  }
}

function resizeCanvas() {
  if (drawingCanvas) {
    const newWidth = Math.max(
      document.documentElement.scrollWidth,
      window.innerWidth
    );
    const newHeight = Math.max(
      document.documentElement.scrollHeight,
      window.innerHeight
    );
    if (
      drawingCanvas.width !== newWidth ||
      drawingCanvas.height !== newHeight
    ) {
      try {
        imageData = drawingCtx.getImageData(
          0,
          0,
          drawingCanvas.width,
          drawingCanvas.height
        );
      } catch (error) {}
      drawingCanvas.width = newWidth;
      drawingCanvas.height = newHeight;
      drawingContainer.style.width = newWidth;

      setupCanvasContext();
      drawingCtx.putImageData(imageData, 0, 0);
    }
  }
}

function setToolMode(mode) {
  switch (mode) {
    case "pen":
      toolStore.updateState("isPen");
      drawingCtx.globalCompositeOperation = "source-over";
      drawingCtx.strokeStyle = toolStore.currentColor;
      brushSizeValueDisplay.value = toolStore.penBrushSize;
      brushSizeSlider.value = toolStore.penBrushSize;
      break;
    case "eraser":
      toolStore.updateState("isEraser");
      drawingCtx.globalCompositeOperation = "destination-out";
      drawingCtx.strokeStyle = "rgba(0,0,0,1)";
      brushSizeValueDisplay.value = toolStore.eraserBrushSize;
      brushSizeSlider.value = toolStore.eraserBrushSize;
      break;
    case "line":
      toolStore.updateState("isLine");
      drawingCtx.globalCompositeOperation = "source-over";
      drawingCtx.strokeStyle = toolStore.currentColor;
      brushSizeValueDisplay.value = toolStore.penBrushSize;
      brushSizeSlider.value = toolStore.penBrushSize;
      break;
  }
}

function createControls() {
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  const cardDiv = shadowRoot.querySelector(".functions");
  if (shadowRoot.getElementById("graffiti-controls")) return;
  graffitiControlsDiv = createEl("div", {
    id: "graffiti-controls",
    class: "function",
  });

  //颜色选择器
  colorPickerInput = createEl("input", {
    id: "color-input",
    type: "color",
    value: toolStore.currentColor,
    title: chrome.i18n.getMessage("graffitiColor"),
  });
  eventStore.on(colorPickerInput, "input", (e) => {
    toolStore.currentColor = e.target.value;
    setToolMode("pen");
  });

  // 笔刷大小滑块
  const brushSizeDiv = createEl("div", {
    style: "display:flex;align-items:center;gap:0.3vh;",
    title: chrome.i18n.getMessage("graffitiBrushSize"),
  });
  brushSizeSlider = createEl("input", {
    id: "brush-slider",
    type: "range",
    min: "1",
    max: "15",
    value: String(toolStore.penBrushSize),
    style: "width:12vh;",
  });

  // 阻止滑块拖动时触发面板拖动
  eventStore.on(brushSizeSlider, "mousedown", (e) => {
    e.stopPropagation();
  });
  eventStore.on(brushSizeSlider, "input", (e) => {
    let size = parseInt(e.target.value, 10);
    brushSizeValueDisplay.value = size;
    brushSizeValueDisplay.textContent = size + "px";
    toolStore.isEraser
      ? (toolStore.eraserBrushSize = size)
      : (toolStore.penBrushSize = size);
  });

  brushSizeValueDisplay = createEl("input", {
    id: "brush-input",
    type: "number",
    min: "1",
    max: "15",
    value: toolStore.penBrushSize,
  });
  eventStore.on(brushSizeValueDisplay, "mousedown", (e) => {
    e.stopPropagation();
  });

  eventStore.on(brushSizeValueDisplay, "change", (e) => {
    let value = parseInt(e.target.value, 10);
    //限制输入的笔刷大小
    if (value < 1) value = 1;
    if (value > 50) value = 50;
    e.target.value = value;
    toolStore.isEraser
      ? (toolStore.eraserBrushSize = value)
      : (toolStore.penBrushSize = value);
    brushSizeSlider.value = value;
  });

  //回车时失去焦点
  eventStore.on(brushSizeValueDisplay, "keydown", (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
  });

  brushSizeDiv.appendChild(brushSizeSlider);
  brushSizeDiv.appendChild(brushSizeValueDisplay);

  //工具组
  const toolGroupDiv = createEl("div", { class: "tool-group" });

  // 橡皮擦
  eraserButton = createEl("button", {
    id: "eraser-btn",
    class: "icon-btn",
    title: chrome.i18n.getMessage("graffitiEraser"),
    innerHTML:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="#ffffff" d="M525.1 311C527 309.1 528 306.6 528 304C528 301.4 527 298.8 525.1 297L343 114.9C341.1 113 338.6 112 336 112C333.4 112 330.8 113 329 114.9L246.9 197L443 393.1L525.1 311L559 345L408 496L552 496C565.3 496 576 506.7 576 520C576 533.3 565.3 544 552 544L210.5 544C193.5 544 177.2 537.3 165.2 525.3L49 409C38.1 398.1 32 383.4 32 368C32 352.6 38.1 337.9 49 327L295 81C305.9 70.1 320.6 64 336 64C351.4 64 366.1 70.1 377 81L559 263C569.9 273.9 576 288.6 576 304C576 319.4 569.9 334.1 559 345L525.1 311zM409.1 427L213 230.9L82.9 361C81 362.9 80 365.4 80 368C80 370.6 81 373.2 82.9 375L199.2 491.3C202.2 494.3 206.3 496 210.5 496L333.5 496C337.7 496 341.8 494.3 344.8 491.3L409.1 427z"/></svg>',
  });
  eventStore.on(eraserButton, "click", () => setToolMode("eraser"));
  eventStore.on(eraserButton, "mousedown", (e) => {
    e.stopPropagation();
  });

  //笔
  penButton = createEl("button", {
    id: "pen-btn",
    class: "icon-btn",
    title: chrome.i18n.getMessage("graffitiPen"),
    innerHTML:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="#ffffff" d="M530.4 64C513.1 64 496.3 69.8 482.6 80.4L278.1 240.3C252.8 260 236.7 288.9 232.9 320.3C230 320.1 227 320 224 320C153.3 320 96 377.3 96 448C96 456.6 96.9 465.1 98.5 473.2C102.1 491.3 90 512 71.5 512L64 512C46.3 512 32 526.3 32 544C32 561.7 46.3 576 64 576L224 576C294.7 576 352 518.7 352 448C352 445 351.9 442.1 351.7 439.1C383.1 435.3 412 419.1 431.7 393.9L591.6 189.3C602.2 175.7 608 158.9 608 141.6C608 98.7 573.3 64 530.4 64zM339.1 392C326.6 366.3 305.7 345.4 280 332.9C280.6 311.5 290.7 291.4 307.6 278.1L512.2 118.3C517.4 114.2 523.8 112 530.4 112C546.7 112 560 125.2 560 141.6C560 148.2 557.8 154.6 553.7 159.8L393.9 364.3C380.7 381.3 360.5 391.4 339.1 391.9zM304 448C304 492.2 268.2 528 224 528L131.9 528C132.4 527.3 132.9 526.5 133.4 525.8C144.9 508.3 150 485.9 145.6 463.8C144.6 458.7 144 453.4 144 448C144 403.8 179.8 368 224 368C268.2 368 304 403.8 304 448z"/></svg>',
  });
  eventStore.on(penButton, "click", () => setToolMode("pen"));
  eventStore.on(penButton, "mousedown", (e) => {
    e.stopPropagation();
  });

  //清屏按钮
  clearButton = createEl("button", {
    id: "clear-btn",
    class: "icon-btn",
    title: chrome.i18n.getMessage("graffitiClear"),
    innerHTML:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="#ffffff" d="M262.2 48C248.9 48 236.9 56.3 232.2 68.8L216 112L120 112C106.7 112 96 122.7 96 136C96 149.3 106.7 160 120 160L520 160C533.3 160 544 149.3 544 136C544 122.7 533.3 112 520 112L424 112L407.8 68.8C403.1 56.3 391.2 48 377.8 48L262.2 48zM128 208L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 208L464 208L464 512C464 520.8 456.8 528 448 528L192 528C183.2 528 176 520.8 176 512L176 208L128 208zM288 280C288 266.7 277.3 256 264 256C250.7 256 240 266.7 240 280L240 456C240 469.3 250.7 480 264 480C277.3 480 288 469.3 288 456L288 280zM400 280C400 266.7 389.3 256 376 256C362.7 256 352 266.7 352 280L352 456C352 469.3 362.7 480 376 480C389.3 480 400 469.3 400 456L400 280z"/></svg>',
  });
  eventStore.on(clearButton, "click", clearCanvas);
  eventStore.on(clearButton, "mousedown", (e) => {
    e.stopPropagation();
  });

  //直线按钮
  lineButton = createEl("button", {
    id: "line-btn",
    class: "icon-btn",
    title: chrome.i18n.getMessage("graffitiLine"),
    innerHTML:
      '<svg t="1758622522401" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8286" width="200" height="200"><rect x="716" y="68" width="240" height="240" fill="#ffffff" p-id="left-square"/><rect x="68" y="716" width="240" height="240" fill="#ffffff" p-id="right-square"/><path d="M756 308L308 756" stroke="#ffffff" stroke-width="60" fill="none" p-id="center-line"/><path d="M956.4 307.6v-240h-240v204.6l-445 445H68v240h240V751.3l443.7-443.7h204.7z m-190-190h140v140h-140v-140zM258 907.2H118v-140h140v140z" fill="#ffffff" p-id="8287" style="fill-opacity:0;"/></svg>',
  });
  eventStore.on(lineButton, "click", () => setToolMode("line"));
  eventStore.on(lineButton, "mousedown", (e) => {
    e.stopPropagation();
  });

  toolGroupDiv.append(penButton, eraserButton, lineButton, clearButton);
  graffitiControlsDiv.append(colorPickerInput, brushSizeDiv, toolGroupDiv);
  cardDiv.appendChild(graffitiControlsDiv);
}

//绘图过程监听
function setupEventListeners() {
  eventStore.on(document, "mousedown", startDrawing);
  eventStore.on(document, "mousemove", draw);
  eventStore.on(document, "mouseup", stopDrawing);
  eventStore.on(document, "mouseleave", stopDrawing);

  //监听窗口大小变化并调整画布
  let resizeTimeout;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resizeCanvas();
    }, 100);
  };
  eventStore.on(window, "resize", handleResize);

  //让画布跟随页面滚动
  // eventStore.on(window,'scroll',()=>{
  //   if(drawingContainer){
  //     drawingContainer.style.top=`${window.scrollY}px`;
  //     drawingContainer.style.left=`${window.scrollX}px`;
  //   }
  // })
}

function startDrawing(e) {
  if (toolStore.isDragging || e.button !== 0) return;
  if (!toolStore.isEraser && !toolStore.isPen && !toolStore.isLine) return;

  toolStore.isDrawing = true;
  drawingContainer.style.pointerEvents = "auto";
  ({ x: startX, y: startY } = getOffsetPos(e, drawingCanvas));

  if (toolStore.isLine) {
    // 保存当前画布状态（包含之前的所有绘制内容）
    imageData = drawingCtx.getImageData(
      0,
      0,
      drawingCanvas.width,
      drawingCanvas.height
    );
  }
  drawingCtx.beginPath();
  drawingCtx.moveTo(startX, startY); //设置画笔初始点
  draw(e); //确保点击时能画点
}

function draw(e) {
  if (!toolStore.isDrawing || !drawingCtx || toolStore.isDragging) return;
  if (!toolStore.isEraser && !toolStore.isPen && !toolStore.isLine) return;
  const { x, y } = getOffsetPos(e, drawingCanvas);

  toolStore.isEraser
    ? (drawingCtx.lineWidth = toolStore.eraserBrushSize)
    : (drawingCtx.lineWidth = toolStore.penBrushSize);

  if (!toolStore.isLine) {
    drawingCtx.lineTo(x, y);
    drawingCtx.stroke();
    drawingCtx.beginPath();
    drawingCtx.moveTo(x, y);
  } else {
    drawingCtx.putImageData(imageData, 0, 0);
    drawingCtx.lineTo(x, y);
    drawingCtx.stroke();
    drawingCtx.beginPath();
    drawingCtx.moveTo(startX, startY);
  }
}

function stopDrawing(e) {
  if (toolStore.isDragging) return;
  if (!toolStore.isEraser && !toolStore.isPen && !toolStore.isLine) return;
  if (toolStore.isDrawing) {
    toolStore.isDrawing = false;
    drawingContainer.style.pointerEvents = "none";

    const { x, y } = getOffsetPos(e, drawingCanvas);
    drawingCtx.lineTo(x, y);
    drawingCtx.stroke();
    drawingCtx && drawingCtx.beginPath();

    saveDrawing();
  }
}

function clearCanvas() {
  if (drawingCtx && drawingCanvas) {
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    //在清除画布后更新存储的画布也为空
    saveDrawing();
  }
}

/* 持久化 */

async function saveDrawing() {
  if (!drawingCanvas) return;
  try {
    const dataURL = drawingCanvas.toDataURL("image/png"); //指定以png的形式保存
    const data = await savePageData("canvas", dataURL);
    await cloudSync.syncAnnotations(data);
  } catch (error) {
    console.log(error);
  }
}

async function loadDrawing() {
  if (!drawingCtx || !drawingCanvas) return;
  try {
    const dataURL = await getPageDataByType("canvas");

    if (dataURL) {
      let img = new Image();
      //保证在图像加载后再绘制到canvas中
      img.onload = () => {
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        drawingCtx.drawImage(img, 0, 0);
      };
      img.onerror = (error) => {
        console.log(error);
      };
      img.src = dataURL;
    }
  } catch (error) {
    console.log(error);
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
  createControls();
  setupEventListeners();

  activateRectangleAnnotation();
  activateImageAnnotation();

  MonitorSPARoutes(handlePageChange);
}
