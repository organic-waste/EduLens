// 可拖动卡片面板
import {activateScrollProgress} from './scrollProgress.js'

let buttonDiv = null;
let cardDiv = null;
let isDragging = false;
let offsetX = 0, offsetY = 0;
let Position = { left: 0, top: 0 };

function createDraggablePanel() {
  if (buttonDiv) return;
  buttonDiv = document.createElement('div');
  buttonDiv.className = 'draggable-btn';
  buttonDiv.textContent = '+';
  document.body.appendChild(buttonDiv);

  // 拖动逻辑
  buttonDiv.addEventListener('mousedown', (e) => {
    isDragging = true;
    //e.clientX —— 鼠标相对于视口的横坐标。
	  //box.offsetLeft —— 方块相对于定位祖先的横坐标
    //二者相减得到“鼠标点击点距离方块左边框”的距离,这样拖动时按钮不会瞬间跳到鼠标位置
    offsetX = e.clientX - buttonDiv.offsetLeft;
    offsetY = e.clientY - buttonDiv.offsetTop;
    //防止拖动时选中文本
    document.body.style.userSelect = 'none';
  });
  document.addEventListener('mousemove', (e) => {
     //确保在拖动状态下才能移动
    if (isDragging) {
      //将拖动范围限制在窗口内
      const left = Math.max(0, Math.min(window.innerWidth - buttonDiv.offsetWidth, e.clientX - offsetX));
      const top = Math.max(0, Math.min(window.innerHeight - buttonDiv.offsetHeight, e.clientY - offsetY));
      buttonDiv.style.left = left + 'px';
      buttonDiv.style.top = top + 'px';
      Position.left = left;
      Position.top = top;

      if (cardDiv) {
        if(left<cardDiv.offsetWidth+20||top<cardDiv.offsetHeight+10){
          console.log('reposition');
          cardDiv.style.left = (left + 60) + 'px';
          cardDiv.style.top = (top + 10) + 'px';
        }else{
          cardDiv.style.left = (left - 10-cardDiv.offsetWidth) + 'px';
          cardDiv.style.top = (top - 5-cardDiv.offsetHeight) + 'px';
        }

      }
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.userSelect = '';// 恢复文字可选中
  });

  buttonDiv.addEventListener('click', (e) => {
    if (isDragging) return; // 确保拖动时不弹窗
    if (!cardDiv) {
      cardDiv = document.createElement('div');
      cardDiv.className = 'draggable-card';
      cardDiv.innerHTML = `
        <div class="card-header">
          <span>功能卡片</span>
          <button class="card-close">×</button>
        </div>
        <div class="card-content">
          <!-- 后续功能 -->
        </div>
      `;
      // 初始弹窗位置跟随按钮
      document.body.appendChild(cardDiv);
      cardDiv.querySelector('.card-close').onclick = () => {
        cardDiv.remove();
        cardDiv = null;
      };
      if(left<cardDiv.offsetWidth+20||top<cardDiv.offsetHeight+10){
          console.log('reposition');
          cardDiv.style.left = (Position.left + 60) + 'px';
          cardDiv.style.top = (Position.top + 10) + 'px';
        }else{
          cardDiv.style.left = (Position.left - 10- cardDiv.offsetWidth) + 'px';
          cardDiv.style.top = (Position.top- 5- cardDiv.offsetHeight) + 'px';
      }
    }
  });

  // 初始位置右下角
  const left = window.innerWidth - 80;
  const top = window.innerHeight - 80;
  buttonDiv.style.left = left + 'px';
  buttonDiv.style.top = top + 'px';
  Position.left = left;
  Position.top = top;


}

export function activateDraggablePanel() {
  createDraggablePanel();
}

export function deactivateDraggablePanel() {
  if (buttonDiv) {
    buttonDiv.remove();
    buttonDiv = null;
  }
  if (cardDiv) {
    cardDiv.remove();
    cardDiv = null;
  }
}