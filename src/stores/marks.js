// store.js
const store = {
  // 涂鸦相关状态
  isDrawing: false,
  isEraser: false,
  isPen: false,
  isDragging: false,
  currentColor: '#FF0000',
  brushSize: 5,
  
  // 矩形注释相关状态
  isRectangleMode: false,
  
  // 页面相关
  currentHoveredRectId: null,
  hoverTimeout: null,
  
  // 状态更新方法
  updateState(newState) {
    Object.assign(this, newState);
  }
};

export default store;