// store.js
const store = {
  // 涂鸦相关状态
  isDrawing: false,
  isDragging: false,
  
  isEraser: false,
  isPen: false,
  isRectangle: false,

  currentColor: '#FF0000',
  brushSize: 5,

  
  // 页面相关
  currentHoveredRectId: null,
  hoverTimeout: null,
  
  // 状态更新方法
  updateState(newState) {
    Object.assign(this, newState);

    // 保证各工具之间互斥
    const penBtn = document.getElementById('pen-btn');
    const eraserBtn = document.getElementById('eraser-btn');
    const rectangleBtn = document.getElementById('rectangle-btn')
    if (this.isPen) {
      penBtn.classList.add('active');
    }else{
      penBtn.classList.remove('active');
    }
    if (this.isEraser) {
      eraserBtn.classList.add('active');
    }else{
      eraserBtn.classList.remove('active');
    }
    if (this.isRectangle){
      rectangleBtn.classList.add('active');
    }else{
      rectangleBtn.classList.remove('active');
    }

  }


};

export default store;