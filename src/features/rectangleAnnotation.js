创建矩形注释

import { getPageKey,getId } from '../utils/getIdentity.js';

let isRectangleMode = false;
let isCreating = false;
let isEditing = false;
let editingRect= null;
let startX, startY, endX, endY;
let hoverTimeout = null;
let hoveredRectId = null;

let rectangleButton = null;
let drawingContainer = null;
let rectangles = [];

let previewDiv = null;
let resizeInfo = { isResizing: false, handle: null, startX: 0, startY: 0, originalRect: null };
let moveInfo = { isMoving: false, startX: 0, startY: 0, originalX: 0, originalY: 0 };

export function activateRectangleAnnotation(){
    drawingContainer=document.getElementById('graffiti-container');
    const toolGroupDiv=document.querySelector('graffiti-controls .tool-group');
    if(!document.getElementById('rectangle-btn')){
        rectangleButton=document.createElement('button');
        rectangleButton.id='rectangle-btn';
        rectangleButton.className='graffiti-icon-btn';
        rectangleButton.title='添加矩形注释';
        rectangleButton.innerHTML='<i class="fas fa-vector-square graffiti-icon"></i>';
        rectangleButton.addEventListener('click',toggleRectangleMode);
        rectangleButton.addEventListener('mousedown',(e)=>e.stopPropagation());
        toolGroupDiv.appendChild(rectangleButton);
    }
    loadRectangles().then(()=>{
        renderAllRectangles();
    });
    setupRectangleEventListeners();

}

function toggleRectangleMode(){
    isRectangleMode=!isRectangleMode;
    if(isRectangleMode){
        rectangleButton.classList.add('active');
        drawingContainer.style.cursor='crosshair';
        exitEditingMode();
        preventPageInteraction();
    }else{
        rectangleButton.classList.remove('active');
        drawingContainer.style.cursor='';
        restorePageInteraction();
    }
}

//防止干荣到其他元素
function preventPageInteraction(){
    document.body.style.userSelect='none';
    document.body.style.pointerEvents='none';
    drawingContainer.style.pointerEvents='auto';

}

function setupRectangleEventListeners(){
    drawingContainer.addEventListener('mousedown', handleMouseDown);
    drawingContainer.addEventListener('mousemove', handleMouseMove);
    drawingContainer.addEventListener('mouseup', handleMouseUp);
    drawingContainer.addEventListener('mouseleave', handleMouseUp);
    drawingContainer.addEventListener('dblclick', handleDblClick);
}

function handleMouseDown(e){
    if(e.button!==0)return;
    const rect = drawingContainer.getBoundingClientRect();
    const x = e.clientX-rect.left;
    const y = e.clientY-rect.top;
    
    //创建新矩阵时
    if(isRectangleMode&&!isEditing){
        isCreating=true;
        startX = endX = x;
        startY = endY = y;
        createPreviewRectangle();
        e.preventDefault();
        e.stopPropagation();
    }
    //矩阵处于编辑态时
    else if(isEditing&&currentRect){
        const handle = getHandleAt(x,y,currentRect);
        //点击到编辑点时
        if(handle){
            startResizing(handle,x,y);
            e.perventDefault();
            e.stopPropagation();
        }
        //点击到矩阵内部
        else if(isPointInRect(x,y,currentRect.x,currentRect.y,currentRect.width,currentRect.height)){
            const textContainer = e.target.closest('.annotation-text-container');
            const deleteBtn = e.target.closest('.annotation-delete-btn');
            if(textContainer||deleteBtn){
                //保证点击在文本和删除按钮上时不触发矩阵的移动
                e.stopPropagation();
                return;
            }
            //移动矩阵
            startMoving(x,y);
            e.perventDefault();
            e.stopPropagation();
        }
        else{
            exitEditingMode();
            e.stopPropagation();
        }
    }
    //矩阵处于浏览态
    else if(!isRectangleMode&&!isEditing){
        const clickRect = findTopmostRectangleAt(x.y);
        if(clickRect){
            enterEditingMode(clickedRect);
            e.preventDefault();
            e.stopPropagation();
        }
    }
}

function handleMouseMove(e){
    const rect = drawingContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    //创建矩阵元素时
    if(isCreating){
        endX=x;
        endY=y;
        updatePreviewRectangle();
    }
    //编辑矩阵时
    else if(isEditing&&currentRect){
        if(window.isResizing){
            doResize(x,y);
            e.preventDefault();
        }else if(window.isMoving){
            doMove(x,y);
            e.perventDefault();
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
    else if(!isRectangleMode && !isEditing){
        const hoveredRect = findTopmostRectangleAt(x,y);
        const hoveredRectId = hoveredRect ? hoveredRect.id : null;
        //当转移hover的元素时
        if(hoveredRectId && hoveredRectId!==window.currentHoveredRectId){
            if(window.hoverTimeout) clearTimeout(window.hoverTimeout);
            window.currentHoveredRectId = hoveredRectId;
            window.hoverTimeout = setTimeout(() => {
                showTooltip(hoveredRectId);
            }, 200);
        }
        //停止hover此元素
        else if(!hoveredRectId && window.currentHoveredRectId){
            if(window.hoverTimeout){
                clearTimeout(window.hoverTimeout);
                window.hoverTimeout = null;
            }
            hideTooltip(window.currentHoveredRectId);
            window.currentHoveredRectId = null;
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
            color: '#FF0000'
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
    window.isResizing = false;
    window.isMoving = false;
    drawingContainer.style.cursor = isRectangleMode ? 'crosshair' : 'default';
    restorePageInteraction();
}

function handleDblClick(e){
    if(isRectangleMode||isEditing) return;
    const rect = drawingContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedRect = findTopmostRectangleAt(x,y);
    if(clickedRect){
        enterEditingMode(clickedRect);
        e.preventDefault();
        e.stopPropagation();        
    }
}


function createPreviewRectangle(){
    if(previewDiv) removePreviewRectangle();
    previewDiv = document.createElement('div');
    previewDiv.className = 'annotation-preview';
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
    document.querySelectorAll('.annotation-rect').forEach(e => e.remove());
    rectangles.forEach(r => renderRectangle(r))
}

function renderRectangle(rect){
    const rectDiv = document.createElement('div');
    rectDiv.className = 'annotation-rect';
    rectDiv.dataset.id = rect.id;
    rectDiv.style.left = `${rectData.x}px`;
    rectDiv.style.top = `${rectData.y}px`;
    rectDiv.style.width = `${rectData.width}px`;
    rectDiv.style.height = `${rectData.height}px`;
    rectDiv.style.borderColor = rectData.color;
    
    //文本区域
    const textContainer = document.createElement('div');
    textContainer.className = 'annotation-text-container';

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.className = 'annotation-text-input';
    textInput.id = `annotation-input-${rectData.id}`;
    textInput.name = `annotation-text-${rectData.id}`;
    textInput.value = rectData.text;
    textInput.style.display = 'none';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'annotation-delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = '删除注释';

    textContainer.appendChild(textInput);
    textContainer.appendChild(deleteBtn);

    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'annotation-tooltip';
    tooltip.textContent = rectData.text;

    rectDiv.appendChild(textContainer);
    rectDiv.appendChild(tooltip);

    textInput.addEventListener('input',(e) => {
        rectData.text = e.target.value;
        tooltip.textContent = e.target.value;
        saveRectangles();
    })
    textInput.addEventListener('mousedown', (e) => e.stopPropagation());
    textInput.addEventListener('click', (e) => e.stopPropagation());

    deleteBtn.addEventListener('click',(e) => {
        e.stopPropagation();
        removeRectangle(rect.id);
    })
    deleteBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    drawingContainer.appendChild(rectDiv);
}

function removeRectangle(id){
    rectangles = rectangles.filter(r => r.id!== id);
    const rectDiv = document.querySelector(`.annotation-rect[data-id="${id}"]`);
    if(rectDiv) rectDiv.remove();
    // 如果删除的是当前编辑的矩形，则退出编辑模式
    if(editingRect && currentRect.id === id){
        exitEditingMode();
    }
    saveRectangles()
}

function enterEditingMode(rect){
    //已经在编辑这个矩阵时
    if(isEditing && editingRect && currentRect.id === rect.id) return;
    exitEditingMode();
    isEditing = true;
    editingRect = rect;

    const rectDiv = document.querySelector(`.annotation-rect[data-id="${rect.id}"]`);
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

function exitEditingMode(){
    if(!isEditing) return;
    isEditing = false;
    if(currentRect){
        const rectDiv = document.querySelector(`.annotation-rect[data-id="${currentRect.id}"]`);
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

        document.querySelectorAll('.resize-handle').forEach(h => h.remove());
    }
    editingRect = null;
    drawingContainer.style.cursor = 'default';
}

function createHandles(rectDiv,rect){
    const handles = [
        { type: 'nw', x: -5, y: -5 }, { type: 'n', x: rectData.width / 2 - 5, y: -5 }, { type: 'ne', x: rectData.width - 5, y: -5 },
        { type: 'e', x: rectData.width - 5, y: rectData.height / 2 - 5 }, { type: 'se', x: rectData.width - 5, y: rectData.height - 5 },
        { type: 's', x: rectData.width / 2 - 5, y: rectData.height - 5 }, { type: 'sw', x: -5, y: rectData.height - 5 }, { type: 'w', x: -5, y: rectData.height / 2 - 5 }
    ];
    handles.forEach(h =>{
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        handle.dataset.type = h.type;
        handle.style.left = `${h.x}px`;
        handle.style.top = `${h.y}px`;
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
        });
        rectDiv.appendChild(handle);
    })
}

function getHandleAt(x,y,rect){
    const rectDiv = document.querySelector(`.annotation-rect[data-id="${rect.id}"]`);
    const handles = rectDiv.querySelectorAll('.resize-handle');
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
}

function getCursorForHandle(handle) {
    const cursorMap = {
        'nw': 'nw-resize', 'n': 'n-resize', 'ne': 'ne-resize',
        'e': 'e-resize', 'se': 'se-resize', 's': 's-resize',
        'sw': 'sw-resize', 'w': 'w-resize'
    };
    return cursorMap[handle.type] || 'default';
}

function startResizing(handle,startX,startY){
    window.isResizing = true;
    window.resizeHandle = handle;
    window.startX = startX;
    window.startY = startY;
    window.originalRect = {
        x:currentRect.x,
        y:currentRect.y,
        width:currentRect.width,
        height:currentRect.height
    };
    preventPageInteraction();
}

function doResize(currentX,currentY){
    if(!window.isResizing||!window.resizeHandle||!window.originalRect) return;
    const dx = currentX - window.startX;
    const dy = currentY - window.startY;
    const orig = window.originalRect;
    let newX = orig.x;
    let newY = orig.y;
    let newW = orig.width;
    let newH = orig.height;

    switch (window.resizeHandle.type) {
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
        if(window.resizeHandle.type.includes('w')) newX = orig.x + orig.width - minWidth;
    }    
    if (newH < minHeight) {
        newH = minHeight; 
        //调整向上拉
        if (window.resizeHandle.type.includes('n')) newY = orig.y + orig.height - minHeight; 
    }

    currentRect.x = newX;
    currentRect.y = newY;
    currentRect.width = newW;
    currentRect.height = newH;
    
    const rectDiv = document.querySelector(`.annotation-rect[data-id="${currentRect.id}"]`);
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

function startMoving(startX, startY) {
    window.isMoving = true;
    window.moveStartX = startX;
    window.moveStartY = startY;
    window.originalRectPos = { x: currentRect.x, y: currentRect.y };
    preventPageInteraction();
}

function doMove(currentX, currentY) {
    if (!window.isMoving || !window.originalRectPos) return;
    const dx = currentX - window.moveStartX;
    const dy = currentY - window.moveStartY;
    const newX = window.originalRectPos.x + dx;
    const newY = window.originalRectPos.y + dy;

    currentRect.x = newX;
    currentRect.y = newY;

    const rectDiv = document.querySelector(`.annotation-rect[data-id="${currentRect.id}"]`);
    rectDiv.style.left = `${newX}px`;
    rectDiv.style.top = `${newY}px`;
}

/* 工具函数 */
function isPointInRect(px,py,rx,ry,rw,rh){
    return px >= rx && px <= rx +rw && py >= ry && px <= ry +rh;
}

function findTopmostRectangleAt(x,y){
    const elements = document.elementsFromPoint(x + window.scrollX,y + window.scrollY);
    for(const el of elements){
        if(el.classList.contains('annotation-rect')){
            const rectId = el.dataset.id;
            return rectangles.find(r => r.id === rectId);
        }
    }
}

function showTooltip(rectId){
    const rectDiv = document.querySelector(`.annotation-rect[data-id="${rectId}"]`);
    const rect =rectangles.find(r => r.id === rectId);
    if(rect && rect.text.trim() !== ''){
        const tooltip = rectDiv.querySelector('.anntotaion-tooltip');
        tooltip.textContent = rect.text;
        tooltip.style.display = 'block';
    }
}

function hideTooltip(rectId){
    const rectDiv = document.querySelector(`.annotation-rect[data-id="${rectId}"]`);
    const tooltip = rectDiv.querySelector('.annotation-tooltip');
    tooltip.style.display = 'none';
}

/* 持久化 */
async function loadRectangles() {
    try{
        const pageKey = getPageKey();
        const result = await chromeExtension.storage.local.get({rectangles:{}});
        rectangles = result.rectangles[pageKey]||[];
    }catch(error){
        console.error(error);
        rectangles = [];
    }
    
}

export { saveRectangles , loadRectangles };