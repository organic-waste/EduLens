// 创建涂鸦
import store from '../store.js';
import MonitorSPARoutes from '../utils/monitorSPARoutes.js'

// 状态和配置
let isDrawing = false;
let currentColor = '#FF0000'; 
let brushSize = 5;
let isEraser = false;
let isPen=false;

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
let penButton = null;
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
  if(drawingCanvas){
    const newWidth=Math.max(document.documentElement.scrollHeight,window.innerHeight);
    const newHeight=Math.max(document.documentElement.scrollHeight,window.innerHeight);
    if(drawingCanvas.width!==newWidth||drawingCanvas.height!==newHeight){
      const imageData=drawingCtx.getImageData(0,0,drawingCanvas.width,drawingCanvas.height);
      drawingCanvas.width = newWidth;
      drawingCanvas.height = newHeight;
      setupCanvasContext();
      drawingCtx.putImageData(imageData,0,0);
    }
  }
}

function setToolMode(mode){
  if(penButton) penButton.classList.remove('active');
  if(eraserButton) eraserButton.classList.remove('active');

  if(mode==='pen'){
    isEraser=false;
    isPen=true;
    penButton.classList.add('active');
    eraserButton.classList.remove('active');
    drawingCtx.globalCompositeOperation='source-over';
    drawingCtx.strokeStyle=currentColor;

  }else if(mode==='eraser'){
    isPen=false;
    isEraser=true;
    eraserButton.classList.add('active');
    penButton.classList.remove('active');
    drawingCtx.globalCompositeOperation='destination-out';
    drawingCtx.strokeStyle='rgba(0,0,0,1)';

  }else{
    isEraser=false;
    isPen=false;
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
  colorPickerInput.id ='color-input';
  colorPickerInput.type = 'color';
  colorPickerInput.value = currentColor;
  colorPickerInput.title = '选择颜色';
  colorPickerInput.addEventListener('input', (e) => {
    currentColor = e.target.value;
    isEraser = false;
    updateEraserButtonState();
  });

  // 笔刷大小滑块
  const brushSizeDiv = document.createElement('div');
  brushSizeDiv.style.display = 'flex';
  brushSizeDiv.style.alignItems = 'center';
  brushSizeDiv.style.gap = '0.3vh';
  brushSizeDiv.title = '调整笔刷大小';

  brushSizeSlider = document.createElement('input');
  brushSizeSlider.id='brush-slider';
  brushSizeSlider.type = 'range';
  brushSizeSlider.min = '1';
  brushSizeSlider.max = '50';
  brushSizeSlider.value = brushSize.toString();
  brushSizeSlider.style.width = '12vh';

  // 阻止滑块拖动时触发面板拖动
  brushSizeSlider.addEventListener('mousedown', (e) => {
    e.stopPropagation(); 
  });

  brushSizeSlider.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value, 10);
    brushSizeValueDisplay.value = brushSize;
    brushSizeValueDisplay.textContent = brushSize + 'px';
  });


  brushSizeValueDisplay = document.createElement('input');
  brushSizeValueDisplay.id='brush-input';
  brushSizeValueDisplay.type = 'number';
  brushSizeValueDisplay.min = '1';
  brushSizeValueDisplay.max = '50';
  brushSizeValueDisplay.value = brushSize;
  brushSizeValueDisplay.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  brushSizeValueDisplay.addEventListener('change', (e) => {
    let value = parseInt(e.target.value);
    // 限制范围
    if (value < 1) value = 1;
    if (value > 50) value = 50;
    e.target.value = value;
    brushSize = value;
    brushSizeSlider.value = value; 
  });

  //回车时失去焦点
  brushSizeValueDisplay.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  });

  brushSizeDiv.appendChild(brushSizeSlider);
  brushSizeDiv.appendChild(brushSizeValueDisplay);

  //工具组
  const toolGroupDiv = document.createElement('div');
  toolGroupDiv.className = 'tool-group';

  // 橡皮擦
  eraserButton = document.createElement('button');
  eraserButton.id = 'eraser-btn';
  eraserButton.className = 'graffiti-icon-btn';
  eraserButton.title = '切换橡皮擦';
  eraserButton.innerHTML='<i class="fas fa-eraser  graffiti-icon"></i>'
  eraserButton.addEventListener('click', () => setToolMode('eraser'));
  eraserButton.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  //笔
  penButton = document.createElement('button'); 
  penButton.id = 'pen-btn';
  penButton.className = 'graffiti-icon-btn'; 
  penButton.title = '画笔';
  penButton.innerHTML='<i class="fas fa-paint-brush graffiti-icon" ></i>'
  penButton.addEventListener('click', () => setToolMode('pen'));
  penButton.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  //清屏按钮
  clearButton = document.createElement('button');
  clearButton.id = 'clear-btn';
  clearButton.className = 'graffiti-icon-btn';
  clearButton.title = '清除所有涂鸦';
  clearButton.innerHTML='<i class="fa-solid fa-trash-can graffiti-icon"></i>'
  clearButton.addEventListener('click', clearCanvas);
  clearButton.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  //保存按钮
  saveButton = document.createElement('button');
  saveButton.id = 'save-btn';
  saveButton.className = 'graffiti-icon-btn';
  saveButton.title = '保存当前涂鸦';
  saveButton.innerHTML='<i class="fa-solid fa-download graffiti-icon"></i>'
  saveButton.addEventListener('click', saveDrawing);
  saveButton.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  toolGroupDiv.appendChild(eraserButton);
  toolGroupDiv.appendChild(penButton);
  toolGroupDiv.appendChild(clearButton);
  toolGroupDiv.appendChild(saveButton);

  graffitiControlsDiv.appendChild(colorPickerInput);
  graffitiControlsDiv.appendChild(brushSizeDiv);
  graffitiControlsDiv.appendChild(toolGroupDiv); 

  cardDiv.appendChild(graffitiControlsDiv);
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
  if(store.isDragging||e.button!==0) return;
  if(!isEraser && !isPen) return;
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
  if(!isDrawing||!drawingCtx||store.isDragging) return;
  if(!isEraser && !isPen) return;
  const rect=drawingCanvas.getBoundingClientRect();
  const PosX=e.clientX-rect.left;
  const PosY=e.clientY-rect.top;

  drawingCtx.lineWidth=brushSize;


  drawingCtx.lineTo(PosX,PosY);
  drawingCtx.stroke();
  drawingCtx.beginPath();
  drawingCtx.moveTo(PosX,PosY);

}

function stopDrawing(){
  if(store.isDragging)return;
  if(!isEraser && !isPen) return;
  if(isDrawing&&!store.isDragging){
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
    const dataURL=drawingCanvas.toDataURL('image/png'); //指定以png的形式保存
    const pageKey=getPageKey();
    const result=await chrome.storage.local.get({canvas: {}})
    const canvas=result.canvas;
    canvas[pageKey]=dataURL;
    await chrome.storage.local.set({canvas});

  }catch (error) {
    console.error(error);
  }
}

async function loadDrawing() {
  if (!drawingCtx || !drawingCanvas) return;
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
        console.log('load drawing',drawingCtx);
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
