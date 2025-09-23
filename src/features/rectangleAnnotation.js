// 创建矩形注释
import eventManager from '../utils/eventManager.js';
import store from '../stores/marks.js';
import { getOffsetPos, createEl } from '../utils/operateEl.js'
import { getPageKey,getId } from '../utils/getIdentity.js';

let isCreating = false; //是否还在创建矩阵中
let isEditing = false; //是否有矩阵处于编辑模式
let editingRect= null;
let startX, startY, endX, endY;
// let hoverTimeout = null;
// let hoverRectId = null;

let rectangleButton = null;
let drawingContainer = null;
let previewDiv = null;
let currentRect = null;

let rectangles = [];

// 矩形操作相关变量
let isResizing = false;
let isMoving = false;
let resizeHandle = null;
let moveStartX = 0;
let moveStartY = 0;
let originalRect = null;
let originalRectPos = null;



export function activateRectangleAnnotation(){
    const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
    drawingContainer=shadowRoot.getElementById('graffiti-container');
    const toolGroupDiv=shadowRoot.querySelector('#graffiti-controls .tool-group');
    if(toolGroupDiv && !toolGroupDiv.querySelector('#rectangle-btn')){
        rectangleButton = createEl('button',{
            id: 'rectangle-btn',
            class:'icon-btn', 
            title:'添加矩形注释', 
            innerHTML:'<svg t="1758595217758" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7344" width="200" height="200"><path d="M0 837.818182l186.181818 0 0 186.181818-186.181818 0 0-186.181818Z" p-id="7345" fill="#ffffff"></path><path d="M232.727273 837.818182l558.545455 0 0 93.090909-558.545455 0 0-93.090909Z" p-id="7346" fill="#ffffff"></path><path d="M93.090909 232.727273l93.090909 0 0 558.545455-93.090909 0 0-558.545455Z" p-id="7347" fill="#ffffff"></path><path d="M0 0l186.181818 0 0 186.181818-186.181818 0 0-186.181818Z" p-id="7348" fill="#ffffff"></path><path d="M232.727273 93.090909l558.545455 0 0 93.090909-558.545455 0 0-93.090909Z" p-id="7349" fill="#ffffff"></path><path d="M837.818182 837.818182l186.181818 0 0 186.181818-186.181818 0 0-186.181818Z" p-id="7350" fill="#ffffff"></path><path d="M837.818182 0l186.181818 0 0 186.181818-186.181818 0 0-186.181818Z" p-id="7351" fill="#ffffff"></path><path d="M837.818182 232.727273l93.090909 0 0 558.545455-93.090909 0 0-558.545455Z" p-id="7352" fill="#ffffff"></path></svg>'
        })
        eventManager.on(rectangleButton,'click',toggleRectangleMode);
        eventManager.on(rectangleButton,'mousedown',(e)=>e.stopPropagation());
        toolGroupDiv.appendChild(rectangleButton);
    }
    loadRectangles().then(()=>{
        renderAllRectangles();
    });
    EditingRectangleEventListeners();
    

}

//转换矩阵模式（编辑模式/查看模式）
function toggleRectangleMode(){
    store.isRectangle = !store.isRectangle
    store.updateState({
        isEraser: false,
        isPen: false,
    })
    if(store.isRectangle){
        drawingContainer.style.cursor='crosshair';
        exitEditingMode();
        preventPageInteraction();
    }else{
        drawingContainer.style.cursor='';
        restorePageInteraction();
    }
}

//监听画布的鼠标事件
function preventPageInteraction(){
    document.body.style.userSelect='none';
    document.body.style.pointerEvents='none';
    drawingContainer.style.pointerEvents='auto';
}

//监听背景的鼠标事件
function restorePageInteraction() {
    document.body.style.userSelect = '';
    document.body.style.pointerEvents = '';
    // drawingContainer.style.pointerEvents = 'none'; 
}

function EditingRectangleEventListeners(){
    eventManager.on(document,'mousedown', handleMouseDown);
    eventManager.on(document,'mousemove', handleMouseMove);
    eventManager.on(document,'mouseup', handleMouseUp);
    eventManager.on(document,'mouseleave', handleMouseUp);
    eventManager.on(document,'dblclick', handleDblClick);
}

function handleMouseDown(e){
    if(e.button!==0)return;
    const { x , y } = getOffsetPos(e,drawingContainer);
    
    //创建新矩阵时
    if(store.isRectangle&&!isEditing){
        isCreating=true;
        startX = endX = x;
        startY = endY = y;
        createPreviewRectangle();
        e.preventDefault();
        e.stopPropagation();
    }
    //矩阵处于编辑态时
    else if(isEditing&&currentRect){

        //点击到矩阵内部
        if(isPointInRect(x,y,currentRect.x,currentRect.y,currentRect.width,currentRect.height)){
 
            const textContainer = e.target.closest('.annotation-text-container');
            const deleteBtn = e.target.closest('.annotation-delete-btn');
            if(textContainer||deleteBtn){
                //保证点击在文本和删除按钮上时不触发矩阵的移动
                e.stopPropagation();
                return;
            }
            //移动矩阵
            startMoving(x,y);
            e.preventDefault();
            e.stopPropagation();
        }
        //点击矩阵外部
        else{
            exitEditingMode();
            e.stopPropagation();
        }
    }
    //矩阵处于浏览态
    else if(!store.isRectangle&&!isEditing){
        const clickedRect = findTopmostRectangleAt(x,y);
        if(clickedRect){
            exitEditingMode(clickedRect);
            e.preventDefault();
            e.stopPropagation();
        }
    }
}

function handleMouseMove(e){
    const { x , y } = getOffsetPos(e,drawingContainer);
    //创建矩阵元素时
    if(isCreating){
        endX=x;
        endY=y;
        updatePreviewRectangle();
    }
    //编辑矩阵时
    else if(isEditing&&currentRect){
        if(isResizing){
            doResize(x,y);
            e.preventDefault();
        }else if(isMoving){
            doMove(x,y);
            e.preventDefault();
        }else {
            const handle = getHandleAt(x,y,currentRect);
            //通过判断鼠标位置来获取到对应的cursor样式
            if(handle){
                drawingContainer.style.cursor= getCursorForHandle(handle);
            }else if(isPointInRect(x,y,currentRect.x,currentRect.y,currentRect.width,currentRect.height)){
                drawingContainer.style.cursor = 'move';
            }else{
                drawingContainer.style.cursor = 'default';
            }
        }
    }
    //查看元素时
    else if(!store.isRectangle && !isEditing){
        const hoveredRect = findTopmostRectangleAt(x,y);
        const hoveredRectId = hoveredRect?.id;
        // 当鼠标下方没有有效矩阵时
        if (!hoveredRect) {
            if (store.currentHoveredRectId) {
                if (store.hoverTimeout) {
                    clearTimeout(store.hoverTimeout);
                }
                hideTooltip(store.currentHoveredRectId);
                store.currentHoveredRectId = null;
            }
            return;
        }

        // 当转移hover的元素时
        if (hoveredRectId && hoveredRectId !== store.currentHoveredRectId) {
            if (store.hoverTimeout) {
                clearTimeout(store.hoverTimeout);
            }
            store.currentHoveredRectId = hoveredRectId;
            store.hoverTimeout = setTimeout(() => {
                showTooltip(hoveredRectId);
            }, 200);
        }
    }
}

function handleMouseUp(e){
    if(isCreating){
        isCreating = false;
        const newRect = {
            id: getId(),
            x: Math.min(startX,endX),
            y: Math.min(startY,endY),
            width: Math.abs(endX - startX),
            height: Math.abs(endY - startY),
            text: '',
            color: store.currentColor
        };
        //排除太小的矩阵
        if(newRect.width > 5 && newRect.height > 5){
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
    drawingContainer.style.cursor = store.isRectangle ? 'crosshair' : 'default';
    restorePageInteraction();
}

function handleDblClick(e){
    if(store.isRectangle||isEditing) return;
    const { x , y } = getOffsetPos(e,drawingContainer);

    const clickedRect = findTopmostRectangleAt(x,y);
    if(clickedRect){
        enterEditingMode(clickedRect);
        e.preventDefault();
        e.stopPropagation();        
    }
}


function createPreviewRectangle(){
    if(previewDiv) removePreviewRectangle();
    previewDiv = createEl('div',{class: 'annotation-preview', style:`border-color:${store.currentColor},border-width: ${store.brushSize}`})
    drawingContainer.appendChild(previewDiv);
}

function updatePreviewRectangle(){
    if(!previewDiv)return;
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    previewDiv.style.left = `${left}px`;
    previewDiv.style.top = `${top}px`;
    previewDiv.style.width = `${width}px`;
    previewDiv.style.height = `${height}px`;
}

function removePreviewRectangle(){
    if(previewDiv && previewDiv.parentNode){
        previewDiv.parentNode.removeChild(previewDiv);
    }
    previewDiv = null;
}

function renderAllRectangles(){
    drawingContainer.querySelectorAll('.annotation-rect').forEach(e => e.remove());
    rectangles.forEach(r => renderRectangles(r))
}

function renderRectangles(rect){
    const rectDiv=createEl('div',{class:'annotation-rect','data-id':rect.id,style:`left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px;border-color:${rect.color};`});
    rectDiv.dataset.id = rect.id;

    const textContainer=createEl('div',{class:'annotation-text-container'});
    const textInput=createEl('input',{type:'text',class:'annotation-text-input',id:`annotation-input-${rect.id}`,name:`annotation-text-${rect.id}`,value:rect.text,style:'display:none;'});
    const deleteBtn=createEl('button',{class:'annotation-delete-btn delete-button',textContent:'×',title:'删除注释'});

    textContainer.append(textInput,deleteBtn);

    const tooltip=createEl('div',{class:'annotation-tooltip',textContent:rect.text,style:`color:${store.currentColor};`});
    rectDiv.append(textContainer,tooltip);

    eventManager.on(textInput,'input',(e) => {
        rect.text = e.target.value;
        tooltip.textContent = e.target.value;
        saveRectangles();
    })
    eventManager.on(textInput,'mousedown', (e) => e.stopPropagation());
    eventManager.on(textInput,'click', (e) => e.stopPropagation());

    eventManager.on(deleteBtn,'click',(e) => {
        e.stopPropagation();
        removeRectangle(rect.id);
    })
    eventManager.on(deleteBtn,'mousedown', (e) => e.stopPropagation());
    drawingContainer.appendChild(rectDiv);
}

function removeRectangle(id){
    const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
    rectangles = rectangles.filter(r => r.id!== id);
    const rectDiv = shadowRoot.querySelector(`.annotation-rect[data-id="${id}"]`);
    if(rectDiv) rectDiv.remove();
    // 如果删除的是当前编辑的矩形，则退出编辑模式
    if(editingRect && currentRect && currentRect.id === id){
        exitEditingMode();
    }
    saveRectangles()
}

//进入创建矩阵模式
function enterEditingMode(rect){
    const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
    //已经在编辑这个矩阵时
    if(isEditing && editingRect && currentRect && currentRect.id === rect.id) return;

    exitEditingMode();
    isEditing = true;
    editingRect = rect;
    currentRect = rect;

    const rectDiv = shadowRoot.querySelector(`.annotation-rect[data-id="${rect.id}"]`);
    if(!rectDiv) return;
    rectDiv.classList.add('editing');

    const textContainer = rectDiv.querySelector('.annotation-text-container');
    const textInput = rectDiv.querySelector('.annotation-text-input');
    const tooltip = rectDiv.querySelector('.annotation-tooltip');

    textContainer.style.display = 'block';
    textInput.style.display = 'block';
    tooltip.style.display = 'none';
    textInput.focus();
    textInput.select();//全选方便编辑
    createHandles(rectDiv,rect);
}

//退出创建矩阵模式
function exitEditingMode(){
    if(!isEditing) return;
    isEditing = false;
    if(currentRect){
        const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
        const rectDiv = shadowRoot.querySelector(`.annotation-rect[data-id="${currentRect.id}"]`);
        if (rectDiv) {
            rectDiv.classList.remove('editing');
            const textContainer = rectDiv.querySelector('.annotation-text-container');
            const textInput = rectDiv.querySelector('.annotation-text-input');
            const tooltip = rectDiv.querySelector('.annotation-tooltip');
            
            textContainer.style.display = 'none';
            textInput.style.display = 'none';

            //有文本的时候才显示tooltip
            if(currentRect.text.trim()!==''){
                tooltip.textContent = currentRect.text;
                tooltip.style.display = 'block';
            } else {
                tooltip.style.display = 'none';
            }

            shadowRoot.querySelectorAll('.resize-handle').forEach(h => h.remove());
        }
    }
    editingRect = null;
    currentRect = null;
    drawingContainer.style.cursor = 'default';
}

function createHandles(rectDiv,rect){
    const handles = [
        { type: 'nw', x: -5, y: -5 }, { type: 'n', x: rect.width / 2 - 5, y: -5 }, { type: 'ne', x: rect.width - 5, y: -5 },
        { type: 'e', x: rect.width - 5, y: rect.height / 2 - 5 }, { type: 'se', x: rect.width - 5, y: rect.height - 5 },
        { type: 's', x: rect.width / 2 - 5, y: rect.height - 5 }, { type: 'sw', x: -5, y: rect.height - 5 }, { type: 'w', x: -5, y: rect.height / 2 - 5 }
    ];
    handles.forEach(h =>{
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        handle.dataset.type = h.type;
        handle.style.left = `${h.x}px`;
        handle.style.top = `${h.y}px`;
        eventManager.on(handle,'mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            //获取container位置转为获取canvas的位置
            const {x, y} = getOffsetPos(e, drawingContainer);
            startResizing({ element: handle, type: handle.dataset.type }, x, y);
        });
        rectDiv.appendChild(handle);
    })
}

function getHandleAt(x,y,rect){
    const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
    const rectDiv = shadowRoot.querySelector(`.annotation-rect[data-id="${rect.id}"]`);
    if (!rectDiv) return null;
    const handles = rectDiv.getElementsByClassName('resize-handle');
    for(let handle of handles){
        const handleRect = handle.getBoundingClientRect();
        const containerRect = drawingContainer.getBoundingClientRect();
        const handleX = handleRect.left - containerRect.left;
        const handleY = handleRect.top - containerRect.top;
        const handleW = handleRect.width;
        const handleH = handleRect.height;
        if(isPointInRect(x,y,handleX,handleY,handleW,handleH)){
            return {
                element:handle,
                type:handle.dataset.type
            };
        }
    }
    return null;
}

function getCursorForHandle(handle) {
    const cursorMap = {
        'nw': 'nw-resize', 'n': 'n-resize', 'ne': 'ne-resize',
        'e': 'e-resize', 'se': 'se-resize', 's': 's-resize',
        'sw': 'sw-resize', 'w': 'w-resize'
    };
    return cursorMap[handle.type] || 'default';
}

function startResizing(handle, x, y){
    isResizing = true;
    resizeHandle = handle;
    moveStartX = x;
    moveStartY = y;
    originalRect = {
        x: currentRect.x,
        y: currentRect.y,
        width: currentRect.width,
        height: currentRect.height
    };
    preventPageInteraction();
}

function doResize(currentX,currentY){
    const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
    if(!isResizing||!resizeHandle||!originalRect) return;
    const dx = currentX - moveStartX;
    const dy = currentY - moveStartY;
    const orig = originalRect;
    let newX = orig.x;
    let newY = orig.y;
    let newW = orig.width;
    let newH = orig.height;

    switch (resizeHandle.type) {
        case 'nw': newX = orig.x + dx; newY = orig.y + dy; newW = orig.width - dx; newH = orig.height - dy; break;
        case 'n': newY = orig.y + dy; newH = orig.height - dy; break;
        case 'ne': newY = orig.y + dy; newW = orig.width + dx; newH = orig.height - dy; break;
        case 'e': newW = orig.width + dx; break;
        case 'se': newW = orig.width + dx; newH = orig.height + dy; break;
        case 's': newH = orig.height + dy; break;
        case 'sw': newX = orig.x + dx; newW = orig.width - dx; newH = orig.height + dy; break;
        case 'w': newX = orig.x + dx; newW = orig.width - dx; break;
    }

    //最小尺寸（否则放不下控制点了）
    const minWidth = 10;
    const minHeight = 10;
    if(newW < minWidth){
        newW = minWidth;
        //调整向左拉
        if(resizeHandle.type.includes('w')) newX = orig.x + orig.width - minWidth;
    }    
    if (newH < minHeight) {
        newH = minHeight; 
        //调整向上拉
        if (resizeHandle.type.includes('n')) newY = orig.y + orig.height - minHeight; 
    }

    currentRect.x = newX;
    currentRect.y = newY;
    currentRect.width = newW;
    currentRect.height = newH;
    
    const rectDiv = shadowRoot.querySelector(`.annotation-rect[data-id="${currentRect.id}"]`);
    if (rectDiv) {
        rectDiv.style.left = `${newX}px`;
        rectDiv.style.top = `${newY}px`;
        rectDiv.style.width = `${newW}px`;
        rectDiv.style.height = `${newH}px`;

        const handles = rectDiv.querySelectorAll('.resize-handle');
        handles.forEach(h => {
            let hx, hy;
            switch(h.dataset.type) {
                case 'nw': hx = -5; hy = -5; break;
                case 'n': hx = newW / 2 - 5; hy = -5; break;
                case 'ne': hx = newW - 5; hy = -5; break;
                case 'e': hx = newW - 5; hy = newH / 2 - 5; break;
                case 'se': hx = newW - 5; hy = newH - 5; break;
                case 's': hx = newW / 2 - 5; hy = newH - 5; break;
                case 'sw': hx = -5; hy = newH - 5; break;
                case 'w': hx = -5; hy = newH / 2 - 5; break;
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

    const rectDiv = shadowRoot.querySelector(`.annotation-rect[data-id="${currentRect.id}"]`);
    if (rectDiv) {
        rectDiv.style.left = `${newX}px`;
        rectDiv.style.top = `${newY}px`;
    }
}

/* 工具函数 */

function isPointInRect(px,py,rx,ry,rw,rh){
    return px >= rx && px <= rx +rw && py >= ry && py <= ry +rh;
}

function findTopmostRectangleAt(x,y){
    const elements = document.elementsFromPoint(x + window.scrollX , y + window.scrollY);
    for(const el of elements){
        if(el.classList && el.classList.contains('annotation-rect')){
            const rectId = el.dataset.id;
            return rectangles.find(r => r.id === rectId);
        }
    }
    return null;

}

function showTooltip(rectId){
    const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
    const rectDiv = shadowRoot.querySelector(`.annotation-rect[data-id="${rectId}"]`);
    const rect =rectangles.find(r => r.id === rectId);
    if(rect && rect.text.trim() !== '' && rectDiv){
        const tooltip = rectDiv.querySelector('.annotation-tooltip');
        if (tooltip) {
            tooltip.textContent = rect.text;
            tooltip.style.opacity = 1;
        }
    }
}

function hideTooltip(rectId){
    const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
    const rectDiv = shadowRoot.querySelector(`.annotation-rect[data-id="${rectId}"]`);
    if (rectDiv) {
        const tooltip = rectDiv.querySelector('.annotation-tooltip');
        if (tooltip) {
            tooltip.style.opacity = 0;
        }
    }
}

/* 持久化 */

async function saveRectangles() {
    try{
        const pageKey = getPageKey();
        const result = await chrome.storage.local.get({rectangles: {}});
        const rects = result.rectangles;
        rects[pageKey] = rectangles;
        await chrome.storage.local.set({ rects });
    }catch(error){
        console.error(error);
    }
}

async function loadRectangles() {
    try{
        const pageKey = getPageKey();
        const result = await chrome.storage.local.get({rects:{}});
        rectangles = result.rects[pageKey]||[];
    }catch(error){
        console.error(error);
        rectangles = [];
    }
}