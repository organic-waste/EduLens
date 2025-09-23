// 创建涂鸦
import eventManager from '../utils/eventManager.js';
import store from '../stores/marks.js';
import MonitorSPARoutes from '../utils/monitorSPARoutes.js'
import { getPageKey } from '../utils/getIdentity.js';
import { getOffsetPos, createEl } from '../utils/operateEl.js'
import { activateRectangleAnnotation } from './rectangleAnnotation.js'

let drawingCanvas = null;
let drawingCtx = null;
let drawingContainer = null;
let colorPickerInput = null;
let brushSizeSlider = null;
let brushSizeValueDisplay = null;
let clearButton = null;
let saveButton = null;
let eraserButton = null;
let penButton = null;
let graffitiControlsDiv = null;

function createDrawingCanvas(){
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  drawingContainer=shadowRoot.getElementById('graffiti-container');
  if(!drawingContainer){
    drawingContainer=createEl('div',{id:'graffiti-container'});
    shadowRoot.appendChild(drawingContainer);
  }
  drawingCanvas = shadowRoot.getElementById('graffiti-canvas');
  if(!drawingCanvas){
    drawingCanvas=createEl('canvas',{id:'graffiti-canvas',width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight});
    drawingContainer.appendChild(drawingCanvas);
    drawingCtx=drawingCanvas.getContext('2d',{willReadFrequently:true}); 
    setupCanvasContext();
  }else{
    drawingCtx=drawingCanvas.getContext('2d',{willReadFrequently:true});
    setupCanvasContext();
    resizeCanvas();
  }
}

function setupCanvasContext(){
    if (drawingCtx) {
        drawingCtx.lineCap = 'round';
        drawingCtx.lineJoin = 'round';
    }
}

function resizeCanvas(){
  if(drawingCanvas){
    const newWidth=Math.max(document.documentElement.scrollWidth,window.innerWidth);
    const newHeight=Math.max(document.documentElement.scrollHeight,window.innerHeight);
    if(drawingCanvas.width!==newWidth||drawingCanvas.height!==newHeight){
      let imageData = null;
      try {
        imageData = drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
      } catch(error) {
        console.warn(error);
      }
      drawingCanvas.width = newWidth;
      drawingCanvas.height = newHeight;      
      drawingContainer.style.width = newWidth;
      
      setupCanvasContext();     
      if(imageData) {
        drawingCtx.putImageData(imageData, 0, 0);
      }
    }
  }
}

function setToolMode(mode){
  switch(mode){
    case 'pen':
      store.updateState({
        isEraser: false,
        isPen: !store.isPen,
        isRectangle: false
      });
      drawingCtx.globalCompositeOperation='source-over';
      drawingCtx.strokeStyle=store.currentColor;
      break;
    case 'eraser':
      store.updateState({
        isEraser:!store.isEraser,
        isPen: false,
        isRectangle: false
      });
      drawingCtx.globalCompositeOperation='destination-out';
      drawingCtx.strokeStyle='rgba(0,0,0,1)';
      break;
    default:
      store.updateState({
        isEraser: false,
        isPen: false
      });
  }
}

function createControls(){
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  const cardDiv=shadowRoot.querySelector('.functions');
  if(shadowRoot.getElementById('graffiti-controls')) return;
  graffitiControlsDiv=createEl('div',{id:'graffiti-controls',class:'function'});

  //颜色选择器
  colorPickerInput=createEl('input',{id:'color-input',type:'color',value:store.currentColor,title:'选择颜色'});
  eventManager.on(colorPickerInput,'input', (e) => {
    store.currentColor = e.target.value;
    setToolMode('pen');
  });

  // 笔刷大小滑块
  const brushSizeDiv=createEl('div',{style:'display:flex;align-items:center;gap:0.3vh;',title:'调整笔刷大小'});
  brushSizeSlider=createEl('input',{id:'brush-slider',type:'range',min:'1',max:'50',value:String(store.brushSize),style:'width:12vh;'});
  
  // 阻止滑块拖动时触发面板拖动
  eventManager.on(brushSizeSlider,'mousedown', (e) => {
    e.stopPropagation(); 
  });
  eventManager.on(brushSizeSlider,'input', (e) => {
    store.brushSize = parseInt(e.target.value, 10);
    brushSizeValueDisplay.value = store.brushSize;
    brushSizeValueDisplay.textContent = store.brushSize + 'px';
  });


  brushSizeValueDisplay=createEl('input',{id:'brush-input',type:'number',min:'1',max:'50',value:store.brushSize});
  brushSizeValueDisplay.value = store.brushSize;
  eventManager.on(brushSizeValueDisplay,'mousedown', (e) => {
    e.stopPropagation();
  });

  eventManager.on(brushSizeValueDisplay,'change', (e) => {
    let value = parseInt(e.target.value);
    // 限制范围
    if (value < 1) value = 1;
    if (value > 50) value = 50;
    e.target.value = value;
    store.brushSize = value;
    brushSizeSlider.value = value; 
  });

  //回车时失去焦点
  eventManager.on(brushSizeValueDisplay,'keydown', (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  });

  brushSizeDiv.appendChild(brushSizeSlider);
  brushSizeDiv.appendChild(brushSizeValueDisplay);

  //工具组
  const toolGroupDiv=createEl('div',{class:'tool-group'});

  // 橡皮擦
  eraserButton=createEl('button',{
    id:'eraser-btn',
    class:'icon-btn',
    title:'切换橡皮擦',
    innerHTML:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path fill="#ffffff" d="M525.1 311C527 309.1 528 306.6 528 304C528 301.4 527 298.8 525.1 297L343 114.9C341.1 113 338.6 112 336 112C333.4 112 330.8 113 329 114.9L246.9 197L443 393.1L525.1 311L559 345L408 496L552 496C565.3 496 576 506.7 576 520C576 533.3 565.3 544 552 544L210.5 544C193.5 544 177.2 537.3 165.2 525.3L49 409C38.1 398.1 32 383.4 32 368C32 352.6 38.1 337.9 49 327L295 81C305.9 70.1 320.6 64 336 64C351.4 64 366.1 70.1 377 81L559 263C569.9 273.9 576 288.6 576 304C576 319.4 569.9 334.1 559 345L525.1 311zM409.1 427L213 230.9L82.9 361C81 362.9 80 365.4 80 368C80 370.6 81 373.2 82.9 375L199.2 491.3C202.2 494.3 206.3 496 210.5 496L333.5 496C337.7 496 341.8 494.3 344.8 491.3L409.1 427z"/></svg>'
  });
  eventManager.on(eraserButton,'click', () => setToolMode('eraser'));
  eventManager.on(eraserButton,'mousedown', (e) => {
    e.stopPropagation();
  });

  //笔
  penButton=createEl('button',{
    id:'pen-btn',
    class:'icon-btn',
    title:'画笔',
    innerHTML:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path fill="#ffffff" d="M530.4 64C513.1 64 496.3 69.8 482.6 80.4L278.1 240.3C252.8 260 236.7 288.9 232.9 320.3C230 320.1 227 320 224 320C153.3 320 96 377.3 96 448C96 456.6 96.9 465.1 98.5 473.2C102.1 491.3 90 512 71.5 512L64 512C46.3 512 32 526.3 32 544C32 561.7 46.3 576 64 576L224 576C294.7 576 352 518.7 352 448C352 445 351.9 442.1 351.7 439.1C383.1 435.3 412 419.1 431.7 393.9L591.6 189.3C602.2 175.7 608 158.9 608 141.6C608 98.7 573.3 64 530.4 64zM339.1 392C326.6 366.3 305.7 345.4 280 332.9C280.6 311.5 290.7 291.4 307.6 278.1L512.2 118.3C517.4 114.2 523.8 112 530.4 112C546.7 112 560 125.2 560 141.6C560 148.2 557.8 154.6 553.7 159.8L393.9 364.3C380.7 381.3 360.5 391.4 339.1 391.9zM304 448C304 492.2 268.2 528 224 528L131.9 528C132.4 527.3 132.9 526.5 133.4 525.8C144.9 508.3 150 485.9 145.6 463.8C144.6 458.7 144 453.4 144 448C144 403.8 179.8 368 224 368C268.2 368 304 403.8 304 448z"/></svg>'
  });
  eventManager.on(penButton,'click', () => setToolMode('pen'));
  eventManager.on(penButton,'mousedown', (e) => {
    e.stopPropagation();
  });

  //清屏按钮
  clearButton=createEl('button',{
    id:'clear-btn',
    class:'icon-btn',
    title:'清除所有涂鸦',
    innerHTML:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path fill="#ffffff" d="M262.2 48C248.9 48 236.9 56.3 232.2 68.8L216 112L120 112C106.7 112 96 122.7 96 136C96 149.3 106.7 160 120 160L520 160C533.3 160 544 149.3 544 136C544 122.7 533.3 112 520 112L424 112L407.8 68.8C403.1 56.3 391.2 48 377.8 48L262.2 48zM128 208L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 208L464 208L464 512C464 520.8 456.8 528 448 528L192 528C183.2 528 176 520.8 176 512L176 208L128 208zM288 280C288 266.7 277.3 256 264 256C250.7 256 240 266.7 240 280L240 456C240 469.3 250.7 480 264 480C277.3 480 288 469.3 288 456L288 280zM400 280C400 266.7 389.3 256 376 256C362.7 256 352 266.7 352 280L352 456C352 469.3 362.7 480 376 480C389.3 480 400 469.3 400 456L400 280z"/></svg>'
  });
  eventManager.on(clearButton,'click', clearCanvas);
  eventManager.on(clearButton,'mousedown', (e) => {
    e.stopPropagation();
  });

  //保存按钮
  saveButton=createEl('button',{
    id:'save-btn',
    class:'icon-btn',
    title:'保存当前涂鸦',
    innerHTML:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path fill="#ffffff" d="M160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 237.3C544 220.3 537.3 204 525.3 192L448 114.7C436 102.7 419.7 96 402.7 96L160 96zM192 192C192 174.3 206.3 160 224 160L384 160C401.7 160 416 174.3 416 192L416 256C416 273.7 401.7 288 384 288L224 288C206.3 288 192 273.7 192 256L192 192zM320 352C355.3 352 384 380.7 384 416C384 451.3 355.3 480 320 480C284.7 480 256 451.3 256 416C256 380.7 284.7 352 320 352z"/></svg>'
  });
  eventManager.on(saveButton,'click', saveDrawing);
  eventManager.on(saveButton,'mousedown', (e) => {
    e.stopPropagation();
  });

  toolGroupDiv.append(eraserButton,penButton,clearButton,saveButton);
  graffitiControlsDiv.append(colorPickerInput,brushSizeDiv,toolGroupDiv);
  cardDiv.appendChild(graffitiControlsDiv);
}

//绘图过程监听
function setupEventListeners(){
  eventManager.on(document,'mousedown', startDrawing);
  eventManager.on(document,'mousemove', draw);
  eventManager.on(document,'mouseup', stopDrawing);
  eventManager.on(document,'mouseleave', stopDrawing);  

  //监听窗口大小变化并调整画布
  let resizeTimeout;
  const handleResize=()=>{
    clearTimeout(resizeTimeout);
    resizeTimeout=setTimeout(() => {
      resizeCanvas();
    }, 100);
  };
  eventManager.on(window,'resize',handleResize);
  
  //让画布跟随页面滚动
  // eventManager.on(window,'scroll',()=>{
  //   if(drawingContainer){
  //     drawingContainer.style.top=`${window.scrollY}px`;
  //     drawingContainer.style.left=`${window.scrollX}px`;
  //   }
  // })
}

function startDrawing(e){
  if(store.isDragging||e.button!==0) return;
  if(!store.isEraser && !store.isPen) return;
  store.isDrawing = true;
  drawingContainer.style.pointerEvents='auto';
  const { x , y } = getOffsetPos(e,drawingCanvas);
  if(drawingCtx){
    drawingCtx.beginPath();
    drawingCtx.moveTo(x,y);//设置画笔初始点
  }
  draw(e);//确保点击时能画点
}

function draw(e){
  if(!store.isDrawing||!drawingCtx||store.isDragging) return;
  if(!store.isEraser && !store.isPen) return;
  const { x , y } = getOffsetPos(e,drawingCanvas);

  drawingCtx.lineWidth=store.brushSize;


  drawingCtx.lineTo(x,y);
  drawingCtx.stroke();
  drawingCtx.beginPath();
  drawingCtx.moveTo(x,y);

}

function stopDrawing(){
  if(store.isDragging)return;
  if(!store.isEraser && !store.isPen) return;
  if(store.isDrawing && !store.isDragging){
    store.isDrawing = false;
    drawingCtx && drawingCtx.beginPath();
    drawingContainer.style.pointerEvents = 'none';
  }
}

function clearCanvas(){
  if(drawingCtx && drawingCanvas){
    drawingCtx.clearRect(0,0,drawingCanvas.width,drawingCanvas.height);
    //在清除画布后更新存储的画布也为空
    saveDrawing();
  }
}

/* 持久化 */

async function saveDrawing() {
  if(!drawingCanvas) return;
  try{
    const dataURL = drawingCanvas.toDataURL('image/png'); //指定以png的形式保存
    const pageKey = getPageKey();
    const result = await chrome.storage.local.get({canvas: {}})
    const canvas = result.canvas;
    canvas[pageKey] = dataURL;
    await chrome.storage.local.set({canvas});

  }catch (error) {
    console.error(error);
  }
}

async function loadDrawing() {
  if (!drawingCtx || !drawingCanvas)return; 
  try{
    const pageKey=getPageKey();
    const result=await chrome.storage.local.get({canvas:{}})
    const dataURL=result.canvas[pageKey];

    if(dataURL){
      let img=new Image();
      //保证在图像加载后再绘制到canvas中
      img.onload=()=>{
        drawingCtx.clearRect(0,0,drawingCanvas.width,drawingCanvas.height);
        drawingCtx.drawImage(img,0,0);
        // console.log('load drawing',drawingCtx);
      }
      img.onerror = (error) => {
        console.error(error);
      };
      img.src=dataURL;
    }

  }catch (error) {
    console.error(error);
  }
}

async function handlePageChange() {
  // console.log('page changed');
  await saveDrawing();
  resizeCanvas();
  await loadDrawing();
}

export function activateGraffiti(){
  createDrawingCanvas();
  loadDrawing();
  createControls();
  setupEventListeners();
  activateRectangleAnnotation();
  MonitorSPARoutes(handlePageChange);
}