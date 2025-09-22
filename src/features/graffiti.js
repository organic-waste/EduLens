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
  drawingContainer=document.getElementById('graffiti-container');
  if(!drawingContainer){
    drawingContainer=createEl('div',{id:'graffiti-container'});
    shadowRoot.appendChild(drawingContainer);
  }
  drawingCanvas=document.getElementById('graffiti-canvas');
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
      // drawingContainer.width = newWidth;
      // drawingContainer.height = newHeight;
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
  const cardDiv=document.querySelector('.functions');
  if(document.getElementById('graffiti-controls')) return;
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
  eraserButton=createEl('button',{id:'eraser-btn',class:'graffiti-icon-btn',title:'切换橡皮擦',innerHTML:'<i class="fas fa-eraser graffiti-icon"></i>'});
  eventManager.on(eraserButton,'click', () => setToolMode('eraser'));
  eventManager.on(eraserButton,'mousedown', (e) => {
    e.stopPropagation();
  });

  //笔
  penButton=createEl('button',{id:'pen-btn',class:'graffiti-icon-btn',title:'画笔',innerHTML:'<i class="fas fa-paint-brush graffiti-icon"></i>'});
  eventManager.on(penButton,'click', () => setToolMode('pen'));
  eventManager.on(penButton,'mousedown', (e) => {
    e.stopPropagation();
  });

  //清屏按钮
  clearButton=createEl('button',{id:'clear-btn',class:'graffiti-icon-btn',title:'清除所有涂鸦',innerHTML:'<i class="fa-solid fa-trash-can graffiti-icon"></i>'});
  eventManager.on(clearButton,'click', clearCanvas);
  eventManager.on(clearButton,'mousedown', (e) => {
    e.stopPropagation();
  });

  //保存按钮
  saveButton=createEl('button',{id:'save-btn',class:'graffiti-icon-btn',title:'保存当前涂鸦',innerHTML:'<i class="fa-solid fa-floppy-disk graffiti-icon"></i>'});
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
  if(store.isDrawing&&!store.isDragging){
    store.isDrawing = false;
    drawingCtx&&drawingCtx.beginPath();
    drawingContainer.style.pointerEvents = 'none';
  }
}

function clearCanvas(){
  if(drawingCtx&&drawingCanvas){
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