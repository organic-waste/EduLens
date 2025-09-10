// 创建涂鸦

import MonitorSPARoutes from '../utils/monitorSPARoutes.js'

// 状态和配置
let isDrawing = false;
let currentColor = '#FF0000'; 
let brushSize = 5;
let isEraser = false;

let drawingCanvas = null;
let drawingCtx = null;
let drawingContainer = null;

// DOM元素
let colorPickerInput = null;
let brushSizeSlider = null;
let brushSizeValueDisplay = null;
let clearButton = null;
let saveButton = null;
let eraserButton = null;
let graffitiControlsDiv = null;

function getPageKey(){
  return window.location.origin+window.location.pathname;
}

function createDrawingCanvas(){
  drawingContainer=document.getElementById('graffiti-container');
  if(!drawingContainer){
    drawingContainer=document.createElement('div');
    document.body.appendChild(drawingContainer);
  }
  drawingCanvas = document.getElementById('graffiti-canvas');
  if (!drawingCanvas) {
    drawingCanvas = document.createElement('canvas');
    drawingCanvas.id = 'graffiti-canvas';
    drawingCanvas.width = document.documentElement.scrollWidth;
    drawingCanvas.height = document.documentElement.scrollHeight;
    drawingContainer.appendChild(drawingCanvas);

    drawingCtx=drawingCanvas.getContext('2d');
    setupCanvasContext();
  }else{
    drawingCtx=drawingCanvas.getContext('2d');
    setupCanvasContext();
    //若画布存在，调整画布大小
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
  if(drawignCanvas){
    const newWidth=Math.max(document.documentElement.scrollHeight,window.innerHeight);
    const newHeight=Math.max(document.documentElement.scrollHeight,window.innerHeight);
    if(drawingCanvas.width!==newWidth||drawingCanvas.height!==newHeight){
      const imageData=drawingCtx.getImageData(0,0,drawignCanvas.width,drawingCanvas.height);
      drawingCanvas.width = newWidth;
      drawingCanvas.height = newHeight;
      setupCanvasContext();
      drawingCtx.putImageData(imageData,0,0);
    }
  }
}

function createControls(){
  const cardDiv=document.querySelector('.functions');
  if(document.getElementById('graffiti-controls')) return;

  graffitiControlsDiv = document.createElement('div');
  graffitiControlsDiv.id = 'graffiti-controls';
  graffitiControlsDiv.className = 'function'; 

  //颜色选择器
  colorPickerInput = document.createElement('input');
  colorPickerInput.type = 'color';
  colorPickerInput.value = currentColor;
  colorPickerInput.title = '选择颜色';
  colorPickerInput.addEventListener('input', (e) => {
    currentColor = e.target.value;
    isEraser = false;
    updateEraserButtonState();
  });

  // 橡皮擦按钮
  eraserButton = document.createElement('button');
  eraserButton.className = 'button';
  eraserButton.textContent = '橡皮擦';
  eraserButton.title = '切换橡皮擦';
  eraserButton.addEventListener('click', toggleEraser);
  updateEraserButtonState(); // 初始化状态

  //清屏按钮
  clearButton = document.createElement('button');
  clearButton.className = 'button';
  clearButton.textContent = '清屏';
  clearButton.title = '清除所有涂鸦';
  clearButton.addEventListener('click', clearCanvas);

  // 笔刷大小滑块容器
  const brushSizeDiv = document.createElement('div');
  brushSizeDiv.style.display = 'flex';
  brushSizeDiv.style.alignItems = 'center';
  brushSizeDiv.style.gap = '0.3vh';
  brushSizeDiv.title = '调整笔刷大小';

  brushSizeSlider = document.createElement('input');
  brushSizeSlider.type = 'range';
  brushSizeSlider.min = '1';
  brushSizeSlider.max = '50';
  brushSizeSlider.value = brushSize.toString();
  brushSizeSlider.style.width = '8vh';

  brushSizeValueDisplay = document.createElement('span');
  brushSizeValueDisplay.textContent = brushSize;

  brushSizeSlider.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value, 10);
    brushSizeValueDisplay.textContent = brushSize;
  });

  brushSizeDiv.appendChild(brushSizeSlider);
  brushSizeDiv.appendChild(brushSizeValueDisplay);

  //保存按钮
  saveButton = document.createElement('button');
  saveButton.className = 'button';
  saveButton.textContent = '保存';
  saveButton.title = '保存当前涂鸦';
  saveButton.addEventListener('click', saveDrawing);


  graffitiControlsDiv.appendChild(colorPickerInput);
  graffitiControlsDiv.appendChild(eraserButton);
  graffitiControlsDiv.appendChild(clearButton);
  graffitiControlsDiv.appendChild(brushSizeDiv);
  graffitiControlsDiv.appendChild(saveButton);

  cardDiv.appendChild(graffitiControlsDiv);
}

function updateEraserButtonState(){
  if(eraserButton){
    if(isEraser){
      eraserButton.style.background='var(--emphasis-color)';
      eraserButton.textContent='绘画';
    }else{
      eraserButton.style.background='';
      eraserButton.textContent='橡皮擦';
    }
  }
}

function toggleEraser(){
  isEraser=!isEraser;
  updateEraserButtonState();
}

//绘图过程监听
function setupEventListeners(){
  window.addEventListener('mousedown', startDrawing);
  window.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', stopDrawing);
  window.addEventListener('mouseleave', stopDrawing);  

  //监听窗口大小变化并调整画布
  let resizeTimeout;
  const handleResize=()=>{
    clearTimeout(resizeTimeout);
    resizeTimeout=setTimeout(() => {
      resizeCanvas();
    }, 100);
  };
  window.addEventListener('resize',handleResize);
  
  //让画布跟随页面滚动
  window.addEventListener('scroll',()=>{
    if(drawingContainer){
      drawingContainer.style.top=`${window.scrollY}px`;
      drawingContainer.style.left=`${window.scrollX}px`;
    }
  })
}

function startDrawing(e){
  isDrawing=true;
  drawingContainer.style.pointerEvents='auto';
  const rect=drawingCanvas.getBoundingClientRect();
  const PosX=e.clientX-rect.left;
  const PosY=e.clientY-rect.top;
  if(drawingCtx){
    drawingCtx.beginPath();
    drawingCtx.moveTo(PosX,PosY);//设置画笔初始点
  }
  draw(e);//确保点击时能画点
}

function draw(e){
  if(!isDrawing||!drawingCtx) return;
  const rect=drawingCanvas.getBoundingClientRect();
  const PosX=e.clientX-rect.left;
  const PosY=e.clientY-rect.top;

  drawingCtx.lineWidth=brushSize;

  //区别是绘制还是擦除
  if(isEraser){
    drawingCtx.globalCompositeOperation='destination-out';
    drawingCtx.strokeStyle='rgba(0,0,0,1)';
  }else{
    drawingCtx.globalCompositeOperation='source-over';
    drawingCtx.strokeStyle=currentColor;
  }

  drawingCtx.lineTo(PosX,PosY);
  drawingCtx.stroke();
  drawingCtx.beginPath();
  drawingCtx.moveTo(PosX,PosY);

}

function stopDrawing(){
  if(isDrawing){
    isDrawing=false;
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

async function saveDrawing() {
  if(!drawingCanvas) return;
  try{
    const dataURL=drawingCanvas.toDataURL('image/png');
    const pageKey=getPageKey();
    const result=await chrome.storage.session.get({canvas: {}})
    const canvas=result.canvas;
    canvas[pageKey]=dataURL;
    await chrome.storage.session.set({canvas});

  }catch (error) {
    console.error(error);
  }
}

async function loadDrawing() {
  if (!drawingCtx || !drawingCanvas) return;
  try{
    const pageKey=getPageKey();
    const result=await chrome.storage.session.get({canvas:{}})
    const dataURL=result.canvas[pageKey];

    if(dataURL){
      let img=new Image();
      img.onload=()=>{
        drawingCtx.clearRect(0,0,drawignCanvas.width,drawignCanvas.height);
        drawingCtx.drawImage(img,0,0);
        console.log('load drawing');
      }
      img.src=dataURL;
    }

  }catch (error) {
    console.error(error);
  }
}

async function handlePageChange() {
  await savaDrawing();
  resizeCanvas();
  await loadDrawing();
}

export function activateGraffiti(){
  createDrawingCanvas();
  loadDrawing();
  createControls();
  setupEventListeners();
  MonitorSPARoutes(handlePageChange)
}
