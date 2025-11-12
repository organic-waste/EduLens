/* 上传图片 */
import eventStore from "../../stores/eventStore.js";
import toolStore from "../../stores/toolStore.js";
import {
  getOffsetPos,
  createEl,
  getPageKey,
  getId,
} from "../../utils/index.js";
import { storageManager, syncManager } from "../../services/index.js";
import {
  preventPageInteraction,
  restorePageInteraction,
} from "../../utils/index.js";

let shadowRoot = null;
let drawingContainer = null;
let imageButton = null;
let fileInput = null;

let images = []; // { id, x, y, width, height, src, fixed }
let isEditing = false;
let editingImg = null;
let currentImg = null;

let isResizing = false;
let isMoving = false;
let resizeHandle = null;
let moveStartX = 0;
let moveStartY = 0;
let originalRect = null;
let originalRectPos = null;

export function activateImageAnnotation() {
  shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  drawingContainer = shadowRoot.getElementById("graffiti-container");
  drawingContainer.style.pointerEvents = "auto";

  // 上传图片
  const toolGroupDiv = shadowRoot.querySelector(
    "#graffiti-controls .tool-group"
  );
  if (toolGroupDiv && !toolGroupDiv.querySelector("#image-btn")) {
    imageButton = createEl("button", {
      id: "image-btn",
      class: "icon-btn",
      title: chrome.i18n.getMessage("imageBtn"),
      innerHTML:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="75 75 500 500"><path d="M160 144C151.2 144 144 151.2 144 160L144 480C144 488.8 151.2 496 160 496L480 496C488.8 496 496 488.8 496 480L496 160C496 151.2 488.8 144 480 144L160 144zM96 160C96 124.7 124.7 96 160 96L480 96C515.3 96 544 124.7 544 160L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 160zM224 192C241.7 192 256 206.3 256 224C256 241.7 241.7 256 224 256C206.3 256 192 241.7 192 224C192 206.3 206.3 192 224 192zM360 264C368.5 264 376.4 268.5 380.7 275.8L460.7 411.8C465.1 419.2 465.1 428.4 460.8 435.9C456.5 443.4 448.6 448 440 448L200 448C191.1 448 182.8 443 178.7 435.1C174.6 427.2 175.2 417.6 180.3 410.3L236.3 330.3C240.8 323.9 248.1 320.1 256 320.1C263.9 320.1 271.2 323.9 275.7 330.3L292.9 354.9L339.4 275.9C343.7 268.6 351.6 264.1 360.1 264.1z" fill="white"/></svg>',
    });
    eventStore.on(imageButton, "click", (e) => {
      fileInput.click();
      toolStore.updateState("isImage");
      e.stopPropagation();
    });
    toolGroupDiv.appendChild(imageButton);
  }

  // 隐藏文件选择 input
  if (!fileInput) {
    fileInput = createEl("input", {
      type: "file",
      accept: "image/*",
      style: "display:none;",
    });
    eventStore.on(fileInput, "change", handleFileChange);
    shadowRoot.appendChild(fileInput);
  }

  setupEventListeners();
  loadImages().then(renderAllImages);

  window.__edulens_reloadImages = () => {
    loadImages().then(renderAllImages);
  };
}

function handleFileChange(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  //仅压缩大文件(超过500KB的)
  if (file.size > 500000) {
    compressImage(file).then((DataURL) => {
      processImageData(DataURL);
    });
  } else {
    const reader = new FileReader();
    reader.onload = () => processImageData(reader.result);
    reader.readAsDataURL(file);
  }

  function processImageData(dataURL) {
    const img = new Image();
    img.onload = () => {
      const maxW = 300;
      const ratio = Math.min(1, maxW / img.width);
      const initW = Math.round(img.width * ratio);
      const initH = Math.round(img.height * ratio);

      const left = Math.round(window.innerWidth / 2 - initW / 2);
      const top = Math.round(window.innerHeight / 2 - initH / 2);

      const newImg = {
        id: getId(),
        x: left,
        y: top,
        width: initW,
        height: initH,
        src: dataURL,
        fixed: true,
      };
      images.push(newImg);
      renderImage(newImg);
      saveImages();
      enterEditingMode(newImg);
      fileInput.value = "";
    };
    img.src = dataURL;
    toolStore.updateState();
  }
}

//图片压缩
function compressImage(file, quality = 0.7) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      //最大尺寸
      const maxWidth = 800;
      const maxHeight = 600;
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.src = URL.createObjectURL(file);
    // console.log("图片压缩成功");
  });
}

function renderAllImages() {
  drawingContainer
    .querySelectorAll(".annotation-image")
    .forEach((e) => e.remove());
  images.forEach((r) => renderImage(r));
}

function renderImage(imgData) {
  const wrap = createEl("div", {
    class: "annotation-image",
    "data-id": imgData.id,
  });
  applyImageStyle(wrap, imgData);
  const imgEl = createEl("img", {
    src: imgData.src,
    draggable: "false",
    alt: "",
  });
  const controls = createEl("div", { class: "image-controls" });
  const deleteBtn = createEl("button", {
    class: "image-delete-btn delete-button",
    title: chrome.i18n.getMessage("imageDelete"),
    textContent: "×",
  });
  const pinBtn = createEl("button", {
    class: "image-pin-btn icon-btn",
    title: chrome.i18n.getMessage("imagePinToggle"),
    innerHTML: imgData.fixed
      ? '<svg t="1759978122492" class="icon" viewBox="0 -100 1074 1074" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1768" width="200" height="200"><path d="M697.464355 375.861272l-20.716763-208.154143h73.988439q16.770713 0 29.102119-12.331406T792.169557 126.273603V41.433526q0-16.770713-12.331407-29.102119T750.736031 0H273.263969q-16.770713 0-29.102119 12.331407T231.830443 41.433526v84.840077q0 16.770713 12.331407 29.10212T273.263969 167.707129h73.988439l-20.716763 208.154143q-68.069364 30.581888-107.529865 80.894027-43.406551 54.258189-43.406551 118.381503 0 17.757225 12.331407 30.088632T217.032755 617.55684h238.736031v181.518305q0 3.94605 1.973025 6.905587l41.433526 83.853565q3.94605 7.8921 12.824663 7.8921t12.824663-7.8921l41.433526-83.853565q1.973025-2.959538 1.973025-6.905587V617.55684h238.736031q16.770713 0 29.102119-12.331406T848.400771 575.136802q0-64.123314-43.406551-118.381503-40.447013-50.312139-107.529865-80.894027z" p-id="1769" fill="white"></path></svg>'
      : '<svg t="1759978010518" class="icon" viewBox="-70 -100 1214 1214" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1559" width="200" height="200"><path d="M741 373.2l-11.4-85.2H784c26.4 0 48-21.6 48-48V48c0-26.4-21.6-48-48-48H240C213.6 0 192 21.6 192 48v192c0 26.4 21.6 48 48 48h54.4l-11.4 85.2C187.2 438.8 128 541.4 128 656c0 26.4 21.6 48 48 48h288v208c0 1.8 0.2 3.4 0.8 5l32 96c4.8 14.6 25.6 14.6 30.4 0l32-96c0.6-1.6 0.8-3.4 0.8-5V704h288c26.4 0 48-21.6 48-48 0-114.6-59.2-217.2-155-282.8zM229 608c16.6-77 71.2-140 143-175.6L404 192H288V96h448v96h-116l32 240.4c71.6 35.6 126.4 98.8 143 175.6z" p-id="1560" fill="white"></path></svg>',
  });

  controls.append(pinBtn, deleteBtn);
  wrap.append(imgEl, controls);
  drawingContainer.appendChild(wrap);

  eventStore.on(deleteBtn, "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    removeImage(imgData.id);
  });
  eventStore.on(deleteBtn, "mousedown", (e) => e.stopPropagation());

  // 定位切换
  eventStore.on(pinBtn, "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (imgData.fixed) {
      // fixed -> absolute（转为页面坐标）
      imgData.x = imgData.x + window.scrollX;
      imgData.y = imgData.y + window.scrollY;
    } else {
      // absolute -> fixed（转为视口坐标）
      imgData.x = imgData.x - window.scrollX;
      imgData.y = imgData.y - window.scrollY;
    }
    imgData.fixed = !imgData.fixed;
    applyImageStyle(wrap, imgData);
    pinBtn.innerHTML = imgData.fixed
      ? '<svg t="1759978122492" class="icon" viewBox="0 -100 1074 1074" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1768" width="200" height="200"><path d="M697.464355 375.861272l-20.716763-208.154143h73.988439q16.770713 0 29.102119-12.331406T792.169557 126.273603V41.433526q0-16.770713-12.331407-29.102119T750.736031 0H273.263969q-16.770713 0-29.102119 12.331407T231.830443 41.433526v84.840077q0 16.770713 12.331407 29.10212T273.263969 167.707129h73.988439l-20.716763 208.154143q-68.069364 30.581888-107.529865 80.894027-43.406551 54.258189-43.406551 118.381503 0 17.757225 12.331407 30.088632T217.032755 617.55684h238.736031v181.518305q0 3.94605 1.973025 6.905587l41.433526 83.853565q3.94605 7.8921 12.824663 7.8921t12.824663-7.8921l41.433526-83.853565q1.973025-2.959538 1.973025-6.905587V617.55684h238.736031q16.770713 0 29.102119-12.331406T848.400771 575.136802q0-64.123314-43.406551-118.381503-40.447013-50.312139-107.529865-80.894027z" p-id="1769" fill="white"></path></svg>'
      : '<svg t="1759978010518" class="icon" viewBox="-70 -100 1214 1214" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1559" width="200" height="200"><path d="M741 373.2l-11.4-85.2H784c26.4 0 48-21.6 48-48V48c0-26.4-21.6-48-48-48H240C213.6 0 192 21.6 192 48v192c0 26.4 21.6 48 48 48h54.4l-11.4 85.2C187.2 438.8 128 541.4 128 656c0 26.4 21.6 48 48 48h288v208c0 1.8 0.2 3.4 0.8 5l32 96c4.8 14.6 25.6 14.6 30.4 0l32-96c0.6-1.6 0.8-3.4 0.8-5V704h288c26.4 0 48-21.6 48-48 0-114.6-59.2-217.2-155-282.8zM229 608c16.6-77 71.2-140 143-175.6L404 192H288V96h448v96h-116l32 240.4c71.6 35.6 126.4 98.8 143 175.6z" p-id="1560" fill="white"></path></svg>';
    saveImages();
  });
  eventStore.on(pinBtn, "mousedown", (e) => e.stopPropagation());

  // 双击进入编辑
  eventStore.on(wrap, "dblclick", (e) => {
    e.preventDefault();
    e.stopPropagation();
    enterEditingMode(imgData);
  });
}

function applyImageStyle(el, imgData) {
  el.style.left = `${imgData.x}px`;
  el.style.top = `${imgData.y}px`;
  el.style.width = `${imgData.width}px`;
  el.style.height = `${imgData.height}px`;
  el.style.borderColor = toolStore.currentColor;
  el.style.position = imgData.fixed ? "fixed" : "absolute";
}

function enterEditingMode(imgData) {
  if (isEditing && editingImg && currentImg && currentImg.id === imgData.id)
    return;

  exitEditingMode();
  isEditing = true;
  editingImg = imgData;
  currentImg = imgData;

  const wrap = shadowRoot.querySelector(
    `.annotation-image[data-id="${imgData.id}"]`
  );
  if (!wrap) return;
  wrap.classList.add("editing");

  drawingContainer.querySelectorAll(".annotation-image").forEach((img) => {
    if (img !== wrap) {
      img.style.pointerEvents = "none";
    }
  });

  drawingContainer.style.cursor = "default";
  createHandles(wrap, imgData);
}

function exitEditingMode() {
  if (!isEditing) return;
  isEditing = false;
  if (currentImg) {
    const wrap = shadowRoot.querySelector(
      `.annotation-image[data-id="${currentImg.id}"]`
    );
    if (wrap) {
      wrap.classList.remove("editing");
      shadowRoot.querySelectorAll(".resize-handle").forEach((h) => h.remove());
    }
  }
  editingImg = null;
  currentImg = null;

  drawingContainer.querySelectorAll(".annotation-image").forEach((img) => {
    img.style.pointerEvents = "auto";
  });

  drawingContainer.style.cursor = "default";
}

function setupEventListeners() {
  eventStore.on(shadowRoot, "mousedown", onMouseDown);
  eventStore.on(shadowRoot, "mousemove", onMouseMove);
  eventStore.on(shadowRoot, "mouseup", onMouseUp);
  eventStore.on(shadowRoot, "mouseleave", onMouseUp);
  eventStore.on(document, "mousedown", onDocumentMouseDown);
}

function onDocumentMouseDown(e) {
  if (isEditing && currentImg) {
    const clickedImage = e.target.closest(".annotation-image");
    if (!clickedImage || clickedImage.dataset.id !== currentImg.id) {
      exitEditingMode();
    }
  }
}

function onMouseDown(e) {
  if (e.button !== 0) return;

  if (isEditing && currentImg) {
    const { x, y } = getPointerByMode(e, currentImg.fixed);

    const wrap = shadowRoot.querySelector(
      `.annotation-image[data-id="${currentImg.id}"]`
    );
    const handle = getHandleAtPointer(x, y, wrap, currentImg);
    //点击到控制点
    if (handle) {
      startResizing({ element: handle, type: handle.dataset.type }, x, y);
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // 点击到图片
    const targetWrap = e.target.closest(".annotation-image");
    const isControlBtn = e.target.closest(".image-controls");
    if (
      targetWrap &&
      targetWrap.dataset.id === currentImg.id &&
      !isControlBtn
    ) {
      startMoving(x, y);
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }
}

function onMouseMove(e) {
  if (!isEditing || !currentImg) return;

  const { x, y } = getPointerByMode(e, currentImg.fixed);

  if (isResizing) {
    doResize(x, y);
    e.preventDefault();
  } else if (isMoving) {
    doMove(x, y);
    e.preventDefault();
  } else {
    const wrap = shadowRoot.querySelector(
      `.annotation-image[data-id="${currentImg.id}"]`
    );
    const handle = wrap ? getHandleAtPointer(x, y, wrap, currentImg) : null;
    if (handle) {
      drawingContainer.style.cursor = getCursorForHandle({
        type: handle.dataset.type,
      });
    } else if (
      pointInRect(
        x,
        y,
        currentImg.x,
        currentImg.y,
        currentImg.width,
        currentImg.height
      )
    ) {
      drawingContainer.style.cursor = "move";
    } else {
      drawingContainer.style.cursor = "default";
    }
  }
}

function onMouseUp(e) {
  isResizing = false;
  isMoving = false;
  drawingContainer.style.cursor = "default";
  restorePageInteraction();

  if (isEditing) saveImages();
}

function createHandles(wrap, img) {
  const handles = [
    { type: "nw", x: -5, y: -5 },
    { type: "n", x: img.width / 2 - 5, y: -5 },
    { type: "ne", x: img.width - 5, y: -5 },
    { type: "e", x: img.width - 5, y: img.height / 2 - 5 },
    { type: "se", x: img.width - 5, y: img.height - 5 },
    { type: "s", x: img.width / 2 - 5, y: img.height - 5 },
    { type: "sw", x: -5, y: img.height - 5 },
    { type: "w", x: -5, y: img.height / 2 - 5 },
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
      const { x, y } = getPointerByMode(e, img.fixed);
      startResizing({ element: handle, type: handle.dataset.type }, x, y);
    });
    wrap.appendChild(handle);
  });
}

function getHandleAtPointer(px, py, wrap, img) {
  const handles = wrap.getElementsByClassName("resize-handle");
  for (let handle of handles) {
    const rect = handle.getBoundingClientRect();
    let hx, hy, hw, hh;
    if (img.fixed) {
      hx = rect.left;
      hy = rect.top;
    } else {
      const containerRect = drawingContainer.getBoundingClientRect();
      hx = rect.left - containerRect.left;
      hy = rect.top - containerRect.top;
    }
    hw = rect.width;
    hh = rect.height;
    if (pointInRect(px, py, hx, hy, hw, hh)) return handle;
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
    x: currentImg.x,
    y: currentImg.y,
    width: currentImg.width,
    height: currentImg.height,
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
      newW = orig.width + dx;
      newY = orig.y + dy;
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

  const minWidth = 20;
  const minHeight = 20;
  if (newW < minWidth) {
    newW = minWidth;
    if (resizeHandle.type.includes("w")) newX = orig.x + orig.width - minWidth;
  }
  if (newH < minHeight) {
    newH = minHeight;
    if (resizeHandle.type.includes("n"))
      newY = orig.y + orig.height - minHeight;
  }

  currentImg.x = newX;
  currentImg.y = newY;
  currentImg.width = newW;
  currentImg.height = newH;

  const wrap = shadowRoot.querySelector(
    `.annotation-image[data-id="${currentImg.id}"]`
  );
  if (wrap) {
    applyImageStyle(wrap, currentImg);

    const handles = wrap.querySelectorAll(".resize-handle");
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
  originalRectPos = { x: currentImg.x, y: currentImg.y };
  preventPageInteraction();
}

function doMove(currentX, currentY) {
  if (!isMoving || !originalRectPos) return;
  const dx = currentX - moveStartX;
  const dy = currentY - moveStartY;
  const newX = originalRectPos.x + dx;
  const newY = originalRectPos.y + dy;

  currentImg.x = newX;
  currentImg.y = newY;

  const wrap = shadowRoot.querySelector(
    `.annotation-image[data-id="${currentImg.id}"]`
  );
  if (wrap) {
    wrap.style.left = `${newX}px`;
    wrap.style.top = `${newY}px`;
  }
}

/* 工具函数 */
function pointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

function getPointerByMode(e, isFixed) {
  if (isFixed) {
    // fixed 定位
    return { x: e.clientX, y: e.clientY };
  } else {
    // absolute 定位
    return getOffsetPos(e, drawingContainer);
  }
}

/* 删除 */
function removeImage(id) {
  images = images.filter((r) => r.id !== id);
  const wrap = shadowRoot.querySelector(`.annotation-image[data-id="${id}"]`);
  if (wrap) wrap.remove();
  if (editingImg && currentImg && currentImg.id === id) {
    exitEditingMode();
  }
  saveImages();
}

/* 持久化 */
async function saveImages() {
  try {
    await storageManager.savePageData("images", images);

    // 发送实时同步操作
    syncManager.sendOperation({
      type: "image-update",
      data: images,
    });
  } catch (error) {
    console.error(error);
  }
}

async function loadImages() {
  try {
    images = await storageManager.getPageDataByType("images");
  } catch (error) {
    console.error(error);
    images = [];
  }
}
