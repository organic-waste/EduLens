//三种截图
import eventManager from "../../stores/eventManager.js";
import { createEl } from "../../utils/operateEl.js";
import store from "../../stores/tools.js";
import {
  preventPageInteraction,
  restorePageInteraction,
  enableUserScroll,
  disableUserScroll,
} from "../../utils/controlInteraction.js";

let funcDiv = null;
let screenshotDiv = null;
let maskDiv = null;
let regionDiv = null;
let DOMBtn = null;
let regionBtn = null;
let scrollBtn = null;
let panelDiv = null;
let stopIndicator = null;
let stopText = null;
let shadowRoot = null;
let imageData = null;
const dpr = window.devicePixelRatio || 1; //设备像素比

export function activateScreenshot() {
  //创建截图按钮
  shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  panelDiv = shadowRoot.querySelector(".draggable-panel");
  funcDiv = panelDiv.querySelector(".functions");
  screenshotDiv = createEl("div", { class: "function" });

  DOMBtn = createEl("button", {
    class: "button",
    textContent: chrome.i18n.getMessage("screenshotDOMBtn"),
  });
  regionBtn = createEl("button", {
    class: "button",
    textContent: chrome.i18n.getMessage("screenshotRegionBtn"),
  });
  scrollBtn = createEl("button", {
    class: "button",
    textContent: chrome.i18n.getMessage("screenshotScrollBtn"),
  });

  screenshotDiv.append(DOMBtn, regionBtn, scrollBtn);
  funcDiv.appendChild(screenshotDiv);

  //绑定按钮点击事件
  eventManager.on(DOMBtn, "click", (e) => handleScreenshot("dom", e));
  eventManager.on(regionBtn, "click", (e) => handleScreenshot("region", e));
  eventManager.on(scrollBtn, "click", (e) => handleScreenshot("scroll", e));
}

async function handleScreenshot(type) {
  //隐藏面板，防止影响截取原网站页面
  panelDiv.style.visibility = "hidden";
  if (type === "dom") {
    store.updateState("isDOM");
    DOMScreenshot();
  } else if (type === "region") {
    store.updateState("isRegion");
    regionScreenshot();
  } else if (type === "scroll") {
    store.updateState("isScroll");
    scrollScreenshot();
  }
}

//DOM截屏相关
function DOMScreenshot() {
  let isMousedown = false;
  let target = null;

  if (!maskDiv) {
    maskDiv = createEl("div", { class: "screenshot-mask mask" });
    shadowRoot.appendChild(maskDiv);
  }

  //使用mouse模拟click事件，防止页面上的元素禁止冒泡导致无法检测到click事件
  window.globalClickMouseDowned = null;
  window.globalClickDownTime = null;

  eventManager.on(document, "mousedown", listenerMousedown);
  eventManager.on(document, "mousemove", listenerMousemove);
  eventManager.on(document, "mouseup", listenerMouseup);

  function listenerMousedown(e) {
    if (!store.isDOM) return;
    target.style.pointerEvents = "none";
    isMousedown = true;
    preventPageInteraction();

    //只响应按下左键
    if (e.which === 1) {
      window.globalClickMouseDowned = true;
      window.globalClickDownTime = new Date().getTime();
    }
  }

  function listenerMousemove(e) {
    if (!store.isDOM) return;

    if (!isMousedown) {
      const paths = document.elementsFromPoint(e.clientX, e.clientY);
      target = paths[0]; //获取表面的第一个DOM元素
      if (target) {
        const targetDomInfo = target.getBoundingClientRect();
        maskDiv.style.width = targetDomInfo.width + "px";
        maskDiv.style.height = targetDomInfo.height + "px";
        maskDiv.style.left = targetDomInfo.left + "px";
        maskDiv.style.top = targetDomInfo.top + "px";
        maskDiv.style.visibility = "visible";
      } else {
        maskDiv.style.visibility = "hidden";
      }
    }
  }

  async function listenerMouseup(e) {
    if (!store.isDOM) return;
    isMousedown = false;
    target.style.pointerEvents = "auto";
    restorePageInteraction();
    maskDiv.style.visibility = "hidden";
    store.updateState();

    //点击DOM元素时
    if (window.globalClickMouseDowned && e.which === 1) {
      window.globalClickMouseDowned = false;
      const now = new Date().getTime();
      //在300ms内视为点击
      if (now - window.globalClickDownTime < 300) {
        requestAnimationFrame(() => {
          requestAnimationFrame(async () => {
            //通知service-worker截取屏幕
            const response = await chrome.runtime.sendMessage({
              type: "SCREENSHOT",
            });
            imageData = response.image;

            //记得将浮点数转换为INT
            const infos = {
              x: parseInt(maskDiv.style.left),
              y: parseInt(maskDiv.style.top),
              w: parseInt(maskDiv.style.width),
              h: parseInt(maskDiv.style.height),
            };
            const croppedImage = await cropImg(imageData, infos);
            copyImg(croppedImage);
            downloadImg(croppedImage);
          });
        });
      }
    }
    panelDiv.style.visibility = "visible";
  }
}

//区域截图相关
function regionScreenshot() {
  let startX, startY, endX, endY;

  if (!regionDiv) {
    regionDiv = createEl("div", { class: "screenshot-region mask" });
    shadowRoot.appendChild(regionDiv);
  }

  eventManager.on(document, "mousedown", (e) => listenerMouseDown(e));
  eventManager.on(document, "mousemove", (e) => listenerMouseMove(e));
  eventManager.on(document, "mouseup", (e) => listenerMouseUp(e));

  function listenerMouseDown(e) {
    if (!store.isRegion) return;
    preventPageInteraction();
    regionDiv.style.visibility = "visible";
    startX = endX = e.clientX;
    startY = endY = e.clientY;

    regionDiv.style.left = `${startX}px`;
    regionDiv.style.top = `${startY}px`;
  }

  function listenerMouseMove(e) {
    if (!store.isRegion) return;
    endX = e.clientX;
    endY = e.clientY;

    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    regionDiv.style.left = `${left}px`;
    regionDiv.style.top = `${top}px`;
    regionDiv.style.width = `${width}px`;
    regionDiv.style.height = `${height}px`;
  }

  async function listenerMouseUp(e) {
    if (!store.isRegion) return;
    regionDiv.style.visibility = "hidden";
    restorePageInteraction();
    store.updateState();

    endX = e.clientX;
    endY = e.clientY;
    // console.log(startX, startY, endX, endY);

    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        const response = await chrome.runtime.sendMessage({
          type: "SCREENSHOT",
        });
        imageData = response.image;

        panelDiv.style.visibility = "visible";

        //记得将浮点数转换为INT
        const infos = {
          x: parseInt(Math.min(startX, endX)),
          y: parseInt(Math.min(startY, endY)),
          w: parseInt(Math.abs(endX - startX)),
          h: parseInt(Math.abs(endY - startY)),
        };
        const croppedImage = await cropImg(imageData, infos);
        copyImg(croppedImage);
        downloadImg(croppedImage);

        startX = null;
        startY = null;
        endX = null;
        endY = null;
      });
    });
  }
}

//滚动截屏相关
async function scrollScreenshot() {
  preventPageInteraction();
  disableUserScroll();
  let startY = window.scrollY;
  let userStopped = false;
  let rafId = null; // 用于 cancelAnimationFrame
  let offsetY = 0; //距离上次截图移动的距离
  const winHeight = window.innerHeight;
  const lineY = Math.round(winHeight * 0.8);
  const shots = [];

  if (!stopIndicator) {
    stopIndicator = createEl("div", { class: "stop-indicator" });
    stopText = createEl("div", {
      class: "stop-text",
      textContent: chrome.i18n.getMessage("screenshotTooltip"),
    });
  }
  stopIndicator.style.top = `${lineY}px`;
  stopText.style.top = `${lineY}px`;
  stopText.style.height = `${winHeight - lineY}px`;
  shadowRoot.append(stopIndicator, stopText);
  stopIndicator.style.display = "block";
  stopText.style.display = "block";
  eventManager.on(
    document,
    "mousedown",
    () => {
      userStopped = true;
    },
    { once: true }
  );

  //截取单帧截图
  async function grabViewport() {
    //使用双rAF确保样式已经重绘了
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r))
    );
    const response = await chrome.runtime.sendMessage({ type: "SCREENSHOT" });
    const img = response.image;
    return img;
  }

  //功能启用的时候立即截取第一帧
  shots.push({
    img: await grabViewport(),
    y: window.scrollY,
  });

  const scrollStep = Math.max(1, Math.floor(winHeight / 100)); // 滚完一屏需要的帧数
  let atBottom = false;
  //每一帧都调用tick来实现自动滚动
  async function tick() {
    if (userStopped) {
      cancelAnimationFrame(rafId);
      return finish();
    }
    //到达底部时
    atBottom =
      Math.ceil(window.scrollY + winHeight) >=
      document.documentElement.scrollHeight;
    if (atBottom) {
      userStopped = true;
      cancelAnimationFrame(rafId);
      return finish();
    }

    window.scrollTo({ top: window.scrollY + scrollStep, behavior: "auto" });
    offsetY += scrollStep;

    //每当满足最小滚动距离就截图
    if (offsetY >= lineY) {
      const img = await grabViewport();
      shots.push({ img, y: window.scrollY });
      offsetY = 0;
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  async function finish() {
    stopIndicator.style.display = "none";
    stopText.style.display = "none";

    const stopY = window.scrollY + winHeight;
    const lastImg = await grabViewport();
    shots.push({ img: lastImg, y: window.scrollY });

    //过滤并裁剪各段截图和区间交集
    const chunks = [];
    let lastY = startY;
    for (let i = 0; i < shots.length; i++) {
      const s = shots[i];
      const top = s.y;
      const bottom =
        atBottom && i === shots.length - 1 ? s.y + winHeight : s.y + lineY;
      const interTop = Math.max(lastY, top);
      const interBottom = Math.min(stopY, bottom);
      const interH = Math.max(0, interBottom - interTop);

      if (interH <= 0) continue; //如果没有交集就丢弃此截图

      const cropped = await cropImg(s.img, {
        x: 0,
        y: Math.round(interTop - top),
        w: window.innerWidth,
        h: Math.round(interH),
      });
      chunks.push({ img: cropped, h: interH });
      lastY = interBottom;
    }

    const result = await combineImages(chunks);
    copyImg(result);
    downloadImg(result);
    store.updateState();
    panelDiv.style.visibility = "visible";
    restorePageInteraction();
    enableUserScroll();
  }
}

//裁剪截图
function cropImg(image, infos) {
  return new Promise((resolve, reject) => {
    // 将CSS坐标转换为设备像素坐标
    const deviceInfos = {
      x: Math.round(infos.x * dpr),
      y: Math.round(infos.y * dpr),
      w: Math.round(infos.w * dpr),
      h: Math.round(infos.h * dpr),
    };
    //现代浏览器支持离线 canvas,可以不用插入到页面DOM中
    const canvas = document.createElement("canvas");

    const img = new Image();
    img.onload = () => {
      const context = canvas.getContext("2d");
      context.imageSmoothingEnabled = false;

      //限制截取区域在视口内
      const safeX = Math.max(0, Math.min(deviceInfos.x, img.width));
      const safeY = Math.max(0, Math.min(deviceInfos.y, img.height));
      const safeW = Math.max(1, Math.min(deviceInfos.w, img.width - safeX));
      const safeH = Math.max(1, Math.min(deviceInfos.h, img.height - safeY));

      canvas.width = safeW;
      canvas.height = safeH;

      //清除之前的画布内容
      context.clearRect(0, 0, canvas.width, canvas.height);

      context.drawImage(
        img,
        safeX,
        safeY,
        safeW,
        safeH, // 源图像区域
        0,
        0,
        safeW,
        safeH // 目标canvas区域
      );
      const croppedImg = canvas.toDataURL(`image/png`);
      resolve(croppedImg);
    };
    img.onerror = () => reject(new Error("image load failed"));
    img.src = image;
  });
}

//合并多个截屏
function combineImages(chunks) {
  return new Promise((resolve, reject) => {
    const imgs = [];
    let loaded = 0;
    chunks.forEach((_, i) => {
      const img = new Image();
      img.onload = () => {
        imgs[i] = img;
        loaded++;
        //加载完chunks对应数量的Image后
        if (loaded === chunks.length) {
          const totalCssHeight = chunks.reduce((acc, i) => acc + i.h, 0);
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
          canvas.height = Math.max(1, Math.round(totalCssHeight * dpr));
          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = false;

          //依次绘制裁剪好的截图
          let offsetCSS = 0;
          chunks.forEach((chunk, i) => {
            ctx.drawImage(
              imgs[i],
              0,
              0,
              imgs[i].naturalWidth,
              imgs[i].naturalHeight,
              0,
              Math.round(offsetCSS * dpr),
              canvas.width,
              Math.round(chunk.h * dpr)
            );
            offsetCSS += chunk.h;
          });
          resolve(canvas.toDataURL("image/png"));
        }
      };
      img.onerror = () => reject(new Error("image load failed"));
      img.src = chunks[i].img;
    });
  });
}

//将截图以图片文件形式写入剪贴板
async function copyImg(image) {
  try {
    const [header, base64] = image.split(",");
    const matches = /data:(.*);base64/.exec(header);
    const mimeType = matches[1];
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([array], { type: mimeType });
    const clipboardItem = new ClipboardItem({ [mimeType]: blob });

    await navigator.clipboard.write([clipboardItem]);
  } catch (error) {
    console.error(error);
  }
}

//自动下载截图图像
function downloadImg(image, filename = `screenshot-${Date.now()}.png`) {
  return new Promise((resolve, reject) => {
    try {
      const link = document.createElement("a");
      link.href = image;
      link.download = filename;
      link.click();
      resolve(true);
    } catch (error) {
      console.error(error);
      reject(false);
    }
  });
}
