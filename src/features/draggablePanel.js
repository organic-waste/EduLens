// 可拖动卡片面板

let buttonDiv = null;
let cardDiv = null;
let isDragging = false;
let offsetX = 0, offsetY = 0;

function createDraggableButton() {
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
      buttonDiv.style.left = (e.clientX - offsetX) + 'px';
      buttonDiv.style.top = (e.clientY - offsetY) + 'px';
      cardDiv.style.left = (e.clientX - offsetX+50) + 'px';
      cardDiv.style.top = (e.clientY - offsetY+30) + 'px';
    }
  });
  document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.userSelect = '';// 恢复文字可选中
  });

  // 点击弹窗
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
      cardDiv.style.left=e.clientX+20+'px';
      cardDiv.style.top=e.clientY+10+'px';
      document.body.appendChild(cardDiv);
      cardDiv.querySelector('.card-close').onclick = () => {
        cardDiv.remove();
        cardDiv = null;
      };
    }
  });

  buttonDiv.style.left = 'calc(100vw - 80px)';
  buttonDiv.style.top = 'calc(100vh - 80px)';


}

export function activateDraggableButton() {
  createDraggableButton();
}

export function deactivateDraggableButton() {
  if (buttonDiv) {
    buttonDiv.remove();
    buttonDiv = null;
  }
  if (cardDiv) {
    cardDiv.remove();
    cardDiv = null;
  }
}